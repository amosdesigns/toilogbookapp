"use server"

import { prisma } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"

/**
 * Helper to determine environment
 */
function getEnvironment() {
  return process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV'
}

/**
 * Syncs Clerk user with database
 * Creates user if doesn't exist, updates if exists
 * This is the ONLY place where we sync Clerk -> Database
 */
export async function syncUserToDatabase() {
  const env = getEnvironment()

  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      console.log(`[${env}][SYNC] No Clerk user found`)
      return { success: false, error: "Not authenticated" }
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress

    if (!email) {
      console.log(`[${env}][SYNC] No email found for Clerk user: ${clerkUser.id}`)
      return { success: false, error: "No email found in Clerk user" }
    }

    console.log(`[${env}][SYNC] Starting sync for: ${email} (Clerk ID: ${clerkUser.id})`)

    // Check if user exists by Clerk ID
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    })

    // If not found by Clerk ID, check by email (handles existing users from seed data)
    if (!dbUser) {
      console.log(`[${env}][SYNC] User not found by Clerk ID, checking by email...`)
      dbUser = await prisma.user.findUnique({
        where: { email },
      })

      // If found by email, update the clerkId
      if (dbUser) {
        console.log(`[${env}][SYNC] ✅ Found existing user by email, updating clerkId`)
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            clerkId: clerkUser.id,
            firstName: clerkUser.firstName || dbUser.firstName || "Unknown",
            lastName: clerkUser.lastName || dbUser.lastName || "User",
          },
        })
        console.log(`[${env}][SYNC] ✅ User updated:`, {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
          clerkId: dbUser.clerkId
        })
      }
    }

    // If user still doesn't exist, create them
    if (!dbUser) {
      console.log(`[${env}][SYNC] Creating new user for Clerk ID: ${clerkUser.id}`)

      dbUser = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email,
          firstName: clerkUser.firstName || "Unknown",
          lastName: clerkUser.lastName || "User",
          // Default role is GUARD - admins can change this in database
          role: "GUARD",
        },
      })

      console.log(`[${env}][SYNC] ✅ User created successfully:`, {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        clerkId: dbUser.clerkId
      })
    } else {
      // Update user info if it changed in Clerk
      // (we only update basic info, NOT the role - role is managed in database)
      const needsUpdate =
        dbUser.email !== email ||
        dbUser.firstName !== clerkUser.firstName ||
        dbUser.lastName !== clerkUser.lastName

      if (needsUpdate) {
        console.log(`[${env}][SYNC] Updating user info for: ${dbUser.email}`)

        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            email,
            firstName: clerkUser.firstName || dbUser.firstName || "Unknown",
            lastName: clerkUser.lastName || dbUser.lastName || "User",
            // NOTE: We do NOT update role - that's managed in database only
          },
        })
        console.log(`[${env}][SYNC] ✅ User info updated`)
      } else {
        console.log(`[${env}][SYNC] ✅ User already in sync, no changes needed`)
      }
    }

    return { success: true, user: dbUser }
  } catch (error) {
    console.error(`[${env}][SYNC] ❌ Error syncing user:`, error)
    const errorMessage = error instanceof Error ? error.message : "Failed to sync user"
    return { success: false, error: errorMessage }
  }
}

/**
 * Gets user from database by Clerk ID
 * This is the primary way to get user data in the app
 */
export async function getCurrentUser() {
  const env = getEnvironment()

  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      console.log(`[${env}][GET_USER] No Clerk user found`)
      return null
    }

    console.log(`[${env}][GET_USER] Clerk user ID:`, clerkUser.id)

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    })

    if (dbUser) {
      console.log(`[${env}][GET_USER] ✅ DB user found:`, `${dbUser.email} (${dbUser.role})`)
    } else {
      console.log(`[${env}][GET_USER] ⚠️  User not found in database for Clerk ID: ${clerkUser.id}`)
    }

    return dbUser
  } catch (error) {
    console.error(`[${env}][GET_USER] ❌ Error:`, error)
    return null
  }
}

/**
 * Gets current user and syncs if not found in database
 * This is the recommended function to use in layouts and server components
 * It ensures the user is always synced before returning
 */
export async function getCurrentUserWithSync() {
  const env = getEnvironment()

  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      console.log(`[${env}][GET_USER_SYNC] No Clerk user found`)
      return null
    }

    console.log(`[${env}][GET_USER_SYNC] Clerk user ID:`, clerkUser.id)

    // Try to get user from database
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    })

    // If user not found, sync them to database
    if (!dbUser) {
      console.log(`[${env}][GET_USER_SYNC] ⚠️  User not in database, triggering sync...`)
      const syncResult = await syncUserToDatabase()

      if (syncResult.success && syncResult.user) {
        dbUser = syncResult.user
        console.log(`[${env}][GET_USER_SYNC] ✅ User synced successfully:`, {
          email: dbUser.email,
          role: dbUser.role,
          id: dbUser.id
        })
      } else {
        console.error(`[${env}][GET_USER_SYNC] ❌ Failed to sync user:`, syncResult.error)
        return null
      }
    } else {
      console.log(`[${env}][GET_USER_SYNC] ✅ User found:`, `${dbUser.email} (${dbUser.role})`)
    }

    return dbUser
  } catch (error) {
    console.error(`[${env}][GET_USER_SYNC] ❌ Error:`, error)
    return null
  }
}
