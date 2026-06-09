/**
 * One-time script to create real Clerk test accounts for E2E testing.
 *
 * Run once: npx tsx scripts/setup-test-users.ts
 *
 * What it does:
 *  1. Picks one seeded user per role (GUARD, SUPERVISOR, ADMIN) from the DB
 *  2. Creates a real Clerk account for each with a stable test password
 *  3. Updates the DB clerkId to the real Clerk user ID
 *  4. Prints the env vars to add to .env
 */

import { createClerkClient } from '@clerk/backend'
import { prisma } from '../lib/prisma'

const TEST_PASSWORD = 'TestPass123!'

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY is not set. Add it to your .env file.')
  }

  const clerk = createClerkClient({ secretKey })

  const rolesToSetup = [
    { role: 'GUARD' as const, envKey: 'TEST_GUARD' },
    { role: 'SUPERVISOR' as const, envKey: 'TEST_SUPERVISOR' },
    { role: 'ADMIN' as const, envKey: 'TEST_ADMIN' },
  ]

  const results: Array<{ envKey: string; email: string; clerkId: string }> = []

  for (const { role, envKey } of rolesToSetup) {
    // Pick the first seeded user for this role
    const dbUser = await prisma.user.findFirst({
      where: { role },
      orderBy: { email: 'asc' },
    })

    if (!dbUser) {
      console.warn(`⚠️  No ${role} user found in the database. Skipping.`)
      continue
    }

    console.log(`\n🔧 Setting up ${role} account: ${dbUser.email}`)

    // Check if a real Clerk account already exists for this email
    const { data: existing } = await clerk.users.getUserList({
      emailAddress: [dbUser.email],
      limit: 1,
    })

    let clerkId: string

    if (existing.length > 0 && !existing[0].id.startsWith('clerk_')) {
      // Real Clerk account already exists
      clerkId = existing[0].id
      console.log(`  ✅ Clerk account already exists: ${clerkId}`)

      // Ensure password auth is enabled
      try {
        await clerk.users.updateUser(clerkId, { password: TEST_PASSWORD })
        console.log(`  🔑 Password updated`)
      } catch {
        console.log(`  ℹ️  Password not updated (account may use social auth only)`)
      }
    } else {
      // Create a new Clerk account
      // Generate a username from the email local part (e.g. guard1 from guard1@toi.gov)
      const username = dbUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')
      // Generate a unique test phone number per user (dev instances allow fake numbers)
      // Use reserved-for-fiction 555-01xx numbers per NANP spec
      const phoneNumber = `+1212555010${results.length}`
      const clerkUser = await clerk.users.createUser({
        emailAddress: [dbUser.email],
        password: TEST_PASSWORD,
        username,
        phoneNumber: [phoneNumber],
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        skipPasswordChecks: true,
        skipPasswordRequirement: true,
      })
      clerkId = clerkUser.id
      console.log(`  ✅ Clerk account created: ${clerkId}`)
    }

    // Update the database clerkId to the real Clerk ID
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { clerkId },
    })
    console.log(`  💾 Database updated with real Clerk ID`)

    results.push({ envKey, email: dbUser.email, clerkId })
  }

  // Also handle SUPER_ADMIN — already has a real Clerk account
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  })
  if (superAdmin && !superAdmin.clerkId.startsWith('clerk_')) {
    results.push({
      envKey: 'TEST_SUPER_ADMIN',
      email: superAdmin.email,
      clerkId: superAdmin.clerkId,
    })
  }

  console.log('\n\n✅ Done! Add these lines to your .env file:\n')
  console.log('# ─── E2E Test Credentials ────────────────────────────────���──────────────────')
  for (const { envKey, email } of results) {
    console.log(`${envKey}_EMAIL=${email}`)
    console.log(`${envKey}_PASSWORD=${TEST_PASSWORD}`)
  }
  console.log('# ───────────────────────────────────────────────────────────────────��────────')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
