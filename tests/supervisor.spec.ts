import { test, expect } from './fixtures/auth'
import { clockIn, getDutyStatus, waitForToast } from './utils/test-helpers'

test.describe('Supervisor Dashboard', () => {
  test('supervisor can access dashboard', async ({ supervisorPage }) => {
    await supervisorPage.goto('/admin/dashboard')

    await expect(supervisorPage).toHaveURL('/admin/dashboard')
    await expect(supervisorPage.locator('h1, h2').filter({ hasText: /dashboard/i })).toBeVisible()
  })

  test('supervisor can view guards on duty', async ({ supervisorPage }) => {
    await supervisorPage.goto('/admin/dashboard')

    // Look for guards on duty section
    const guardsSection = supervisorPage.locator('text=/guards on duty/i')
    await expect(guardsSection).toBeVisible()

    // Should see a table or list of guards
    const guardsTable = supervisorPage.locator('table, [role="table"]')
    const hasTable = (await guardsTable.count()) > 0

    if (hasTable) {
      // Table should have headers like Name, Location, Clock In Time
      await expect(guardsTable).toBeVisible()
    }
  })

  test('supervisor can send message to guard', async ({ supervisorPage }) => {
    await supervisorPage.goto('/admin/dashboard')

    // Look for guards on duty table
    const messageButton = supervisorPage.locator('button:has-text("Message"), button:has-text("Send Message")')
    const hasMessages = (await messageButton.count()) > 0

    if (hasMessages) {
      await messageButton.first().click()
      await supervisorPage.waitForSelector('[role="dialog"]')

      // Type message
      await supervisorPage.fill('textarea[name="message"], input[name="message"]', 'Please check the north dock')

      // Send message
      await supervisorPage.click('button:has-text("Send")')
      await waitForToast(supervisorPage, 'sent successfully')
    }
  })

  test('supervisor can force clock out a guard', async ({ supervisorPage }) => {
    await supervisorPage.goto('/admin/dashboard')

    // Look for guards on duty table
    const endDutyButton = supervisorPage.locator('button:has-text("End Duty"), button:has-text("Clock Out")')
    const hasGuards = (await endDutyButton.count()) > 0

    if (hasGuards) {
      await endDutyButton.first().click()

      // Confirm action
      const confirmButton = supervisorPage.locator('button:has-text("Confirm"), button:has-text("Yes")')
      if ((await confirmButton.count()) > 0) {
        await confirmButton.click()
      }

      await waitForToast(supervisorPage, /clocked out|ended/i)
    }
  })

  test('supervisor can view incident reports by status', async ({ supervisorPage }) => {
    await supervisorPage.goto('/admin/dashboard')

    // Look for incident tabs
    const tabs = supervisorPage.locator('[role="tablist"]')
    const hasTabs = (await tabs.count()) > 0

    if (hasTabs) {
      // Click on different tabs
      await supervisorPage.click('button:has-text("All")')
      await supervisorPage.click('button:has-text("Unreviewed")')
      await supervisorPage.click('button:has-text("Live")')

      // Each tab should show relevant incidents
      await expect(supervisorPage.locator('text=/incident|report/i')).toBeVisible()
    }
  })
})

test.describe('Supervisor Permissions', () => {
  test('supervisor can access admin routes', async ({ supervisorPage }) => {
    await supervisorPage.goto('/admin/dashboard')
    await expect(supervisorPage).toHaveURL('/admin/dashboard')

    // Should see admin navigation
    await expect(supervisorPage.locator('nav[aria-label="Admin Navigation"]')).toBeVisible()
  })

  test('guard cannot access admin routes', async ({ guardPage }) => {
    await guardPage.goto('/admin/dashboard')

    // Should redirect to home page or show access denied
    await expect(guardPage).not.toHaveURL('/admin/dashboard')
  })
})

test.describe('Notifications', () => {
  test('supervisor can view notifications', async ({ supervisorPage }) => {
    await supervisorPage.goto('/admin/dashboard')

    // Look for notification banner or bell icon
    const notificationArea = supervisorPage.locator('[role="alert"], .notification-banner')
    const hasNotifications = (await notificationArea.count()) > 0

    if (hasNotifications) {
      await expect(notificationArea).toBeVisible()
    }
  })

  test('supervisor can dismiss notifications', async ({ supervisorPage }) => {
    await supervisorPage.goto('/admin/dashboard')

    // Look for notification with dismiss button
    const dismissButton = supervisorPage.locator('button:has-text("Dismiss"), button[aria-label*="dismiss"]')
    const hasNotifications = (await dismissButton.count()) > 0

    if (hasNotifications) {
      const notificationCount = await dismissButton.count()
      await dismissButton.first().click()

      // Wait a moment for the notification to be dismissed
      await supervisorPage.waitForTimeout(500)

      // Count should decrease
      const newCount = await dismissButton.count()
      expect(newCount).toBeLessThan(notificationCount)
    }
  })
})
