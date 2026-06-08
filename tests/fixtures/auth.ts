import { test as base } from '@playwright/test'
import type { Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

type AuthFixtures = {
  guardPage: Page
  supervisorPage: Page
  adminPage: Page
  superAdminPage: Page
}

/**
 * Load pre-authenticated storage state (created in global-setup.ts).
 * This is far faster than creating a sign-in token per test — the auth
 * state is created once per role per test run.
 */
function storageStatePath(role: string): string {
  return path.resolve(process.cwd(), `.auth/${role}.json`)
}

async function createAuthPage(
  browser: import('@playwright/test').Browser,
  role: string,
): Promise<[import('@playwright/test').BrowserContext, Page]> {
  const stateFile = storageStatePath(role)

  if (!fs.existsSync(stateFile)) {
    throw new Error(
      `Auth state not found: ${stateFile}\n` +
      `Run global setup first or: npx tsx scripts/setup-test-users.ts`,
    )
  }

  const context = await browser.newContext({ storageState: stateFile })
  const page = await context.newPage()

  // Navigate to home so Clerk's session is active before the test starts.
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')

  return [context, page]
}

export const test = base.extend<AuthFixtures>({
  guardPage: async ({ browser }, use) => {
    const [context, page] = await createAuthPage(browser, 'guard')
    await use(page)
    await context.close()
  },

  supervisorPage: async ({ browser }, use) => {
    const [context, page] = await createAuthPage(browser, 'supervisor')
    await use(page)
    await context.close()
  },

  adminPage: async ({ browser }, use) => {
    const [context, page] = await createAuthPage(browser, 'admin')
    await use(page)
    await context.close()
  },

  superAdminPage: async ({ browser }, use) => {
    const [context, page] = await createAuthPage(browser, 'super-admin')
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
