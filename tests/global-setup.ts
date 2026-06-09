import { chromium, type FullConfig } from '@playwright/test'
import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright'
import { createClerkClient } from '@clerk/backend'
import dotenv from 'dotenv'
import path from 'path'

export default async function globalSetup(config: FullConfig) {
  // Load env files — .env.local overrides .env
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
  dotenv.config({ path: path.resolve(process.cwd(), '.env') })

  // Fetch Clerk testing token (bypasses bot-protection for the whole run).
  await clerkSetup()

  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:3000'
  const secretKey = process.env.CLERK_SECRET_KEY!
  const clerk = createClerkClient({ secretKey })

  // Accounts to pre-authenticate. Each gets its own storage-state file that
  // fixtures load instead of running the full sign-in flow per test.
  const accounts = [
    {
      userId: process.env.TEST_GUARD_CLERK_USER_ID!,
      file: '.auth/guard.json',
    },
    {
      userId: process.env.TEST_SUPERVISOR_CLERK_USER_ID!,
      file: '.auth/supervisor.json',
    },
    {
      userId: process.env.TEST_ADMIN_CLERK_USER_ID!,
      file: '.auth/admin.json',
    },
    {
      userId: process.env.TEST_SUPER_ADMIN_CLERK_USER_ID!,
      file: '.auth/super-admin.json',
    },
  ].filter((a) => Boolean(a.userId))

  if (!accounts.length) {
    console.warn(
      '[global-setup] No TEST_*_CLERK_USER_ID vars found — skipping auth pre-setup. ' +
      'Run: npx tsx scripts/setup-test-users.ts',
    )
    return
  }

  const browser = await chromium.launch()

  for (const { userId, file } of accounts) {
    const context = await browser.newContext()
    await setupClerkTestingToken({ context })

    const signInToken = await clerk.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: 300, // 5 min — plenty for the global setup
    })

    const page = await context.newPage()
    await page.goto(`${baseURL}/sign-in?__clerk_ticket=${signInToken.token}`)

    // Wait for sign-in to complete and Clerk's JS to fully initialise.
    await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'), {
      timeout: 30000,
    })
    // Let Clerk's client-side session settle before saving state.
    await page.waitForTimeout(3000)

    await context.storageState({ path: file })
    await context.close()
    console.log(`[global-setup] ✅ Saved auth state: ${file}`)
  }

  await browser.close()
}
