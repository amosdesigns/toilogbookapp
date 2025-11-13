import { test, expect } from './fixtures/auth'
import { clockIn, clockOut, getDutyStatus, waitForToast } from './utils/test-helpers'

test.describe('Duty Management - Guard', () => {
  test('guard can clock in to a location', async ({ guardPage }) => {
    await guardPage.goto('/')

    // Check initial status
    const initialStatus = await getDutyStatus(guardPage)
    if (initialStatus === 'on-duty') {
      await clockOut(guardPage)
    }

    // Clock in
    await clockIn(guardPage, 'guard', 'Timber Point Marina')

    // Verify on-duty status
    const status = await getDutyStatus(guardPage)
    expect(status).toBe('on-duty')

    // Verify duty status card is visible
    await expect(guardPage.locator('text=/on duty|active/i')).toBeVisible()
  })

  test('guard can clock out', async ({ guardPage }) => {
    await guardPage.goto('/')

    // Ensure guard is on duty first
    const initialStatus = await getDutyStatus(guardPage)
    if (initialStatus === 'off-duty') {
      await clockIn(guardPage, 'guard', 'Timber Point Marina')
    }

    // Clock out
    await clockOut(guardPage)

    // Verify off-duty status
    const status = await getDutyStatus(guardPage)
    expect(status).toBe('off-duty')
  })

  test('guard cannot clock in without selecting a location', async ({ guardPage }) => {
    await guardPage.goto('/')

    const status = await getDutyStatus(guardPage)
    if (status === 'on-duty') {
      await clockOut(guardPage)
    }

    await guardPage.click('button:has-text("Report for Duty")')
    await guardPage.waitForSelector('[role="dialog"]')

    // Try to clock in without selecting location
    const clockInButton = guardPage.locator('button:has-text("Clock In")')

    // Button should be disabled or form should show validation error
    const isDisabled = await clockInButton.isDisabled()
    expect(isDisabled).toBe(true)
  })
})

test.describe('Duty Management - Supervisor', () => {
  test('supervisor can clock in for roaming duty', async ({ supervisorPage }) => {
    await supervisorPage.goto('/admin/dashboard')

    const status = await getDutyStatus(supervisorPage)
    if (status === 'on-duty') {
      await clockOut(supervisorPage)
    }

    // Clock in for roaming duty
    await clockIn(supervisorPage, 'supervisor')

    // Verify on-duty status
    const newStatus = await getDutyStatus(supervisorPage)
    expect(newStatus).toBe('on-duty')
  })

  test('supervisor can check in to locations during roaming duty', async ({
    supervisorPage,
  }) => {
    await supervisorPage.goto('/admin/dashboard')

    // Ensure supervisor is on duty
    const status = await getDutyStatus(supervisorPage)
    if (status === 'off-duty') {
      await clockIn(supervisorPage, 'supervisor')
    }

    // Find and click location check-in button
    await supervisorPage.click('button:has-text("Check In")')
    await supervisorPage.waitForSelector('[role="dialog"]')

    // Select a location
    await supervisorPage.click('[role="combobox"]')
    await supervisorPage.click('[role="option"]:has-text("Timber Point Marina")')

    // Add optional notes
    await supervisorPage.fill('textarea[name="notes"]', 'Routine check - all clear')

    // Submit check-in
    await supervisorPage.click('button[type="submit"]')
    await waitForToast(supervisorPage, 'Checked in successfully')
  })
})
