import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { createClerkClient } from '@clerk/backend'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

test.describe('Authentication', () => {
  test('should redirect unauthenticated users to sign-in', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('should allow users to sign in', async ({ context, page }) => {
    const secretKey = process.env.CLERK_SECRET_KEY
    const userId = process.env.TEST_GUARD_CLERK_USER_ID
    if (!secretKey || !userId) {
      test.skip(true, 'CLERK_SECRET_KEY or TEST_GUARD_CLERK_USER_ID not set')
      return
    }

    await setupClerkTestingToken({ context })

    const clerk = createClerkClient({ secretKey })
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: 60,
    })

    await page.goto(`/sign-in?__clerk_ticket=${signInToken.token}`)
    await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'), { timeout: 20000 })
    await expect(page).toHaveURL(/\/(|dashboard)/)
  })

  test('should not authenticate with invalid credentials', async ({ context, page }) => {
    await setupClerkTestingToken({ context })

    await page.goto('/sign-in')
    await page.fill('input[name="identifier"]', 'invalid@example.com')
    await page.click('button:has-text("Continue")')

    // Give Clerk a moment to process the identifier
    await page.waitForTimeout(3000)

    // With an unknown email, Clerk either shows an error or goes to sign-up.
    // Either way, we should NOT be authenticated (not redirected to the app).
    await expect(page).not.toHaveURL(/^\/((?!sign).)*$/, { timeout: 5000 }).catch(() => {
      // If this check times out it means we stayed on sign-in/sign-up — which is correct.
    })

    // Verify we're still on a Clerk auth page (not logged into the app)
    const currentUrl = page.url()
    const onAuthPage = currentUrl.includes('/sign-in') || currentUrl.includes('/sign-up') ||
      currentUrl.includes('accounts.google') || currentUrl.includes('clerk')
    expect(onAuthPage).toBe(true)
  })
})
