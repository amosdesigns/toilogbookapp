import type { Page } from '@playwright/test'

/**
 * Test helper utilities for common operations
 */

/**
 * Wait for a toast notification to appear
 */
export async function waitForToast(page: Page, message?: string) {
  if (message) {
    await page.waitForSelector(`[data-sonner-toast]:has-text("${message}")`)
  } else {
    await page.waitForSelector('[data-sonner-toast]')
  }
}

/**
 * Get the current duty status from the UI
 */
export async function getDutyStatus(page: Page): Promise<'on-duty' | 'off-duty'> {
  const onDutyButton = page.locator('button:has-text("Sign Off Duty")')
  const offDutyButton = page.locator('button:has-text("Report for Duty")')

  const isOnDuty = await onDutyButton.isVisible()
  const isOffDuty = await offDutyButton.isVisible()

  if (isOnDuty) return 'on-duty'
  if (isOffDuty) return 'off-duty'

  throw new Error('Could not determine duty status')
}

/**
 * Clock in as a guard or supervisor
 */
export async function clockIn(
  page: Page,
  role: 'guard' | 'supervisor',
  location?: string
) {
  await page.click('button:has-text("Report for Duty")')
  await page.waitForSelector('[role="dialog"]')

  if (role === 'guard' && location) {
    // Select location for guard
    await page.click('[role="combobox"]')
    await page.click(`[role="option"]:has-text("${location}")`)
  }

  await page.click('button:has-text("Clock In")')
  await waitForToast(page, 'Clocked in successfully')
}

/**
 * Clock out
 */
export async function clockOut(page: Page) {
  await page.click('button:has-text("Sign Off Duty")')
  await waitForToast(page)
}

/**
 * Create a log entry
 */
export async function createLog(
  page: Page,
  type: 'INCIDENT' | 'PATROL' | 'VISITOR_CHECKIN' | 'MAINTENANCE' | 'WEATHER' | 'OTHER',
  title: string,
  description: string
) {
  await page.goto('/logs')
  await page.click('button:has-text("New Log")')

  // Fill in the form
  await page.selectOption('select[name="type"]', type)
  await page.fill('input[name="title"]', title)
  await page.fill('textarea[name="description"]', description)

  await page.click('button[type="submit"]')
  await waitForToast(page, 'Log created successfully')
}

/**
 * Navigate to a specific page in the app
 */
export async function navigateTo(
  page: Page,
  destination: 'home' | 'logs' | 'shifts' | 'profile' | 'dashboard'
) {
  const routes: Record<typeof destination, string> = {
    home: '/',
    logs: '/logs',
    shifts: '/shifts',
    profile: '/profile',
    dashboard: '/admin/dashboard',
  }

  await page.goto(routes[destination])
}

/**
 * Check if user has a specific role
 */
export async function hasRole(page: Page, role: 'GUARD' | 'SUPERVISOR' | 'ADMIN' | 'SUPER_ADMIN'): Promise<boolean> {
  const adminSidebar = page.locator('nav[aria-label="Admin Navigation"]')
  const publicNav = page.locator('nav[aria-label="Public Navigation"]')

  const isAdmin = await adminSidebar.isVisible().catch(() => false)
  const isPublic = await publicNav.isVisible().catch(() => false)

  if (role === 'GUARD') return isPublic && !isAdmin
  return isAdmin && !isPublic
}
