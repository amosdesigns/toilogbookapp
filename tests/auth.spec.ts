import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should redirect unauthenticated users to sign-in', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('should allow users to sign in', async ({ page }) => {
    const email = process.env.TEST_GUARD_EMAIL || 'guard@test.com'
    const password = process.env.TEST_GUARD_PASSWORD || 'testpass123'

    await page.goto('/sign-in')

    // Fill in Clerk sign-in form
    await page.fill('input[name="identifier"]', email)
    await page.click('button:has-text("Continue")')

    await page.fill('input[name="password"]', password)
    await page.click('button:has-text("Continue")')

    // Should redirect to home or dashboard after login
    await expect(page).toHaveURL(/\/(|admin\/dashboard)/)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/sign-in')

    await page.fill('input[name="identifier"]', 'invalid@test.com')
    await page.click('button:has-text("Continue")')

    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button:has-text("Continue")')

    // Should show error message
    await expect(page.locator('text=/incorrect|invalid|error/i')).toBeVisible()
  })
})
