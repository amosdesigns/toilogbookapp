# Playwright Tests

This directory contains end-to-end tests for the Town of Islip Marina Guard Logbook application using Playwright.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

### 3. Configure Test Users

You need to create test users in Clerk for each role. Add their credentials to your `.env.local` file:

```env
# Test User Credentials
TEST_GUARD_EMAIL=guard@test.com
TEST_GUARD_PASSWORD=testpass123

TEST_SUPERVISOR_EMAIL=supervisor@test.com
TEST_SUPERVISOR_PASSWORD=testpass123

TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=testpass123

TEST_SUPER_ADMIN_EMAIL=superadmin@test.com
TEST_SUPER_ADMIN_PASSWORD=testpass123

# Playwright Test Base URL (optional)
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in UI mode (recommended for development)

```bash
npm run test:ui
```

### Run specific test file

```bash
npx playwright test auth.spec.ts
```

### Run tests for a specific project (browser)

```bash
npx playwright test --project=chromium
```

### Run tests in headed mode (see browser)

```bash
npx playwright test --headed
```

### Debug tests

```bash
npm run test:debug
```

## Test Structure

```
tests/
├── fixtures/
│   └── auth.ts              # Authentication fixtures for different roles
├── utils/
│   └── test-helpers.ts      # Helper functions for common operations
├── auth.spec.ts             # Authentication tests
├── duty-management.spec.ts  # Duty clock in/out tests
├── logs.spec.ts             # Log creation and management tests
├── supervisor.spec.ts       # Supervisor dashboard tests
└── README.md                # This file
```

## Test Fixtures

The `tests/fixtures/auth.ts` file provides authenticated page contexts for each user role:

```typescript
import { test, expect } from './fixtures/auth'

test('guard can create logs', async ({ guardPage }) => {
  // guardPage is already authenticated as a guard
  await guardPage.goto('/logs')
  // ... test code
})
```

Available fixtures:
- `guardPage` - Authenticated as Guard
- `supervisorPage` - Authenticated as Supervisor
- `adminPage` - Authenticated as Admin
- `superAdminPage` - Authenticated as Super Admin

## Test Helpers

The `tests/utils/test-helpers.ts` file provides utility functions:

- `clockIn(page, role, location?)` - Clock in as guard or supervisor
- `clockOut(page)` - Clock out from duty
- `createLog(page, type, title, description)` - Create a log entry
- `getDutyStatus(page)` - Get current duty status
- `waitForToast(page, message?)` - Wait for toast notification
- `navigateTo(page, destination)` - Navigate to app pages

## Writing New Tests

### Basic Test Example

```typescript
import { test, expect } from '@playwright/test'

test('test name', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Welcome')
})
```

### Role-Based Test Example

```typescript
import { test, expect } from './fixtures/auth'

test('supervisor can view dashboard', async ({ supervisorPage }) => {
  await supervisorPage.goto('/admin/dashboard')
  await expect(supervisorPage).toHaveURL('/admin/dashboard')
})
```

## CI/CD Integration

Tests are configured to run automatically in CI with:
- 2 retries on failure
- Single worker (no parallel execution)
- HTML reporter for results

## Viewing Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Debugging Failed Tests

### View trace
```bash
npx playwright show-trace trace.zip
```

### Use Playwright Inspector
```bash
npx playwright test --debug
```

### Use VS Code Extension
Install the "Playwright Test for VSCode" extension for inline test running and debugging.

## Best Practices

1. **Use fixtures** for authenticated sessions instead of signing in each test
2. **Use test helpers** for common operations to keep tests DRY
3. **Clean up state** - clock out at the end of duty tests to avoid state conflicts
4. **Use waiters** - Always wait for elements/actions to complete
5. **Descriptive test names** - Use clear, descriptive test names
6. **Group related tests** - Use `test.describe()` blocks
7. **Mobile testing** - Tests run on both desktop and mobile viewports

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Use `page.waitForLoadState('networkidle')` for slow pages

### Authentication failing
- Verify test user credentials in `.env.local`
- Check that users exist in Clerk dashboard
- Ensure users have correct roles assigned

### Flaky tests
- Add proper waiters (`waitForSelector`, `waitForURL`)
- Use `waitForToast()` helper after actions
- Avoid hard-coded timeouts, use event-based waits
