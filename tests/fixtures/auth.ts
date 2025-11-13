import { test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Authentication fixture for Playwright tests
 *
 * This provides authenticated sessions for different user roles.
 * You'll need to set up test users in Clerk for each role.
 */

type AuthFixtures = {
  guardPage: Page
  supervisorPage: Page
  adminPage: Page
  superAdminPage: Page
}

/**
 * Helper function to sign in a user
 */
async function signIn(page: Page, email: string, password: string) {
  await page.goto('/sign-in')
  await page.waitForURL('/sign-in')

  // Fill in Clerk sign-in form
  await page.fill('input[name="identifier"]', email)
  await page.click('button:has-text("Continue")')

  await page.fill('input[name="password"]', password)
  await page.click('button:has-text("Continue")')

  // Wait for redirect after successful login
  await page.waitForURL(/\/(|admin\/dashboard)/, { timeout: 10000 })
}

/**
 * Extended test fixture with authenticated pages for different roles
 *
 * Usage:
 * ```typescript
 * test('guard can clock in', async ({ guardPage }) => {
 *   await guardPage.goto('/')
 *   // Test with authenticated guard session
 * })
 * ```
 */
export const test = base.extend<AuthFixtures>({
  guardPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    const email = process.env.TEST_GUARD_EMAIL || 'guard@test.com'
    const password = process.env.TEST_GUARD_PASSWORD || 'testpass123'

    await signIn(page, email, password)
    await use(page)
    await context.close()
  },

  supervisorPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    const email = process.env.TEST_SUPERVISOR_EMAIL || 'supervisor@test.com'
    const password = process.env.TEST_SUPERVISOR_PASSWORD || 'testpass123'

    await signIn(page, email, password)
    await use(page)
    await context.close()
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    const email = process.env.TEST_ADMIN_EMAIL || 'admin@test.com'
    const password = process.env.TEST_ADMIN_PASSWORD || 'testpass123'

    await signIn(page, email, password)
    await use(page)
    await context.close()
  },

  superAdminPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    const email = process.env.TEST_SUPER_ADMIN_EMAIL || 'superadmin@test.com'
    const password = process.env.TEST_SUPER_ADMIN_PASSWORD || 'testpass123'

    await signIn(page, email, password)
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
