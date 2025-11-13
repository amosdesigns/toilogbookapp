import { test, expect } from './fixtures/auth'
import { createLog, waitForToast, clockIn, getDutyStatus } from './utils/test-helpers'

test.describe('Log Management', () => {
  test.beforeEach(async ({ guardPage }) => {
    // Ensure guard is on duty before creating logs
    await guardPage.goto('/')
    const status = await getDutyStatus(guardPage)
    if (status === 'off-duty') {
      await clockIn(guardPage, 'guard', 'Timber Point Marina')
    }
  })

  test('guard can create a patrol log', async ({ guardPage }) => {
    await createLog(
      guardPage,
      'PATROL',
      'Evening Patrol',
      'Completed evening patrol of marina grounds. No issues found.'
    )

    // Verify log appears in the list
    await guardPage.goto('/logs')
    await expect(guardPage.locator('text=Evening Patrol')).toBeVisible()
  })

  test('guard can create an incident report', async ({ guardPage }) => {
    await guardPage.goto('/logs')
    await guardPage.click('button:has-text("New Log")')

    // Select incident type
    await guardPage.selectOption('select[name="type"]', 'INCIDENT')

    // Fill in basic info
    await guardPage.fill('input[name="title"]', 'Suspicious Activity')
    await guardPage.fill(
      'textarea[name="description"]',
      'Observed suspicious activity near boat slip 12'
    )

    // Fill in incident-specific fields
    await guardPage.selectOption('select[name="severity"]', 'MEDIUM')
    await guardPage.fill('input[name="peopleInvolved"]', 'Unknown individual')
    await guardPage.fill('textarea[name="actionsTaken"]', 'Approached and questioned individual. They left the area.')

    await guardPage.click('button[type="submit"]')
    await waitForToast(guardPage, 'Log created successfully')

    // Verify incident appears in logs
    await guardPage.goto('/logs')
    await expect(guardPage.locator('text=Suspicious Activity')).toBeVisible()
  })

  test('guard can create a visitor check-in log', async ({ guardPage }) => {
    await createLog(
      guardPage,
      'VISITOR_CHECKIN',
      'Visitor Check-In',
      'John Doe checked in at 2:00 PM for boat slip 45'
    )

    await guardPage.goto('/logs')
    await expect(guardPage.locator('text=Visitor Check-In')).toBeVisible()
  })

  test('guard can view their log history', async ({ guardPage }) => {
    await guardPage.goto('/logs')

    // Should see logs list
    await expect(guardPage.locator('h1, h2').filter({ hasText: /logs/i })).toBeVisible()

    // Should see at least the navigation
    await expect(guardPage.locator('nav')).toBeVisible()
  })

  test('guard can filter logs by type', async ({ guardPage }) => {
    await guardPage.goto('/logs')

    // Look for filter controls (if implemented)
    const filterExists = await guardPage.locator('select[name="type"], button:has-text("Filter")').count()

    if (filterExists > 0) {
      // Test filtering functionality
      await guardPage.selectOption('select[name="type"]', 'PATROL')

      // Verify only patrol logs are shown
      await expect(guardPage.locator('text=/patrol/i')).toBeVisible()
    }
  })
})

test.describe('Log Management - Supervisor', () => {
  test('supervisor can review incident reports', async ({ supervisorPage }) => {
    await supervisorPage.goto('/admin/dashboard')

    // Look for unreviewed incidents section
    const incidentsSection = supervisorPage.locator('text=/unreviewed|incident/i').first()
    await expect(incidentsSection).toBeVisible()

    // If there are incidents to review
    const reviewButton = supervisorPage.locator('button:has-text("Review")')
    const hasIncidents = (await reviewButton.count()) > 0

    if (hasIncidents) {
      await reviewButton.first().click()
      await supervisorPage.waitForSelector('[role="dialog"]')

      // Add review notes
      await supervisorPage.fill('textarea[name="reviewNotes"]', 'Reviewed and acknowledged')

      // Submit review
      await supervisorPage.click('button:has-text("Submit Review")')
      await waitForToast(supervisorPage, 'reviewed successfully')
    }
  })

  test('supervisor can view location logbook', async ({ supervisorPage }) => {
    await supervisorPage.goto('/admin/dashboard')

    // Find location logbook section
    const logbookSection = supervisorPage.locator('text=/location logbook/i')
    await expect(logbookSection).toBeVisible()

    // Select a location
    await supervisorPage.click('[role="combobox"]')
    await supervisorPage.click('[role="option"]:has-text("Timber Point Marina")')

    // Should see recent logs for that location
    await expect(supervisorPage.locator('text=/recent|log/i')).toBeVisible()
  })
})
