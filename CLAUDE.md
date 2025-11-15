# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session Initialization

**IMPORTANT - Auto-Initialize MCP Tools:**
When starting work on this Next.js project, automatically call the `init` tool from `next-devtools-mcp` FIRST to set up proper context with official Next.js documentation and available development tools.

**After Every Code Change:**
Always run `npm run validate` to ensure TypeScript type checking and ESLint pass before committing changes.

## Project Overview

Town of Islip Marina Guard Logbook - A comprehensive security management system for 11 marina locations with dual-interface architecture:
- **Public Frontend** (mobile-first): Guards in the field (`/(public)`)
- **Admin Backend** (desktop-focused): Supervisors/Admins/Super Admins (`/(admin)`)

### Key Technologies
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: Clerk
- **Storage**: Supabase (media files)
- **UI**: Tailwind CSS v4 + shadcn/ui (Radix primitives)
- **Forms**: react-hook-form + Zod validation
- **State Management**: React Server Actions (no separate API routes)
- **Testing**: Playwright for end-to-end testing

### Architecture Highlights
- **Server Actions over API Routes**: All backend operations use Next.js Server Actions
- **Role-Based Access Control**: Four-tier hierarchy (Super Admin → Admin → Supervisor → Guard)
- **Dual Interface**: Separate mobile and desktop UX optimized for different user roles
- **Real-time Features**: Auto-polling notifications, live duty status updates
- **Media Support**: Video upload/playback for incident documentation

## Common Commands

### Development
```bash
npm run dev            # Start dev server
npm run build          # Build for production
npm start              # Start production server
npm run lint           # Run ESLint
```

### Testing
```bash
npm test               # Run all Playwright tests
npm run test:ui        # Run tests in UI mode (recommended for development)
npm run test:headed    # Run tests in headed mode (see browser)
npm run test:debug     # Debug tests with Playwright Inspector
npm run test:chromium  # Run tests in Chromium only
npm run test:firefox   # Run tests in Firefox only
npm run test:webkit    # Run tests in WebKit/Safari only
npm run test:mobile    # Run tests on mobile viewports
npm run test:report    # View HTML test report
```

### Database Operations
```bash
npx prisma studio             # Open database GUI (port 5555)
npx prisma migrate dev        # Create and apply migrations
npx prisma generate           # Generate Prisma client (run after schema changes)
npx prisma db push            # Push schema changes without migration (dev only)
npx prisma db seed            # Seed database (if seed script exists)
```

### Code Quality & Validation
```bash
npm run typecheck          # Run TypeScript type checking
npm run validate           # Run typecheck + lint (use after code changes)
```

**IMPORTANT**: After making any code changes, ALWAYS run `npm run validate` to ensure:
- TypeScript types are correct (no compilation errors)
- ESLint rules are satisfied (code quality standards)

## MCP Server Integration

This project is configured with Model Context Protocol (MCP) servers to enhance Claude Code capabilities:

### Configured MCP Servers

**1. GitHub MCP Server** - Official GitHub integration
- **Tools**: Repository management, issue tracking, PR operations
- **Setup**: Requires `GITHUB_PERSONAL_ACCESS_TOKEN` in `.env.local`
- **Capabilities**: Create/update issues, manage PRs, repository operations

**2. Next.js DevTools MCP** - Next.js runtime diagnostics
- **Tools**: Live application state, runtime info, build diagnostics
- **Auto-initialization**: Automatically calls `init` tool on session start
- **Capabilities**: Access dev server state, inspect routes, analyze build

**3. Vercel MCP Server** - Vercel deployment and project management
- **Tools**: Deploy, manage projects, view deployments, environment variables
- **Setup**: Requires `VERCEL_API_TOKEN` in `.env.local`
- **Capabilities**: Trigger deployments, view logs, manage env vars

### MCP Setup Instructions

**1. Add environment variables to `.env.local`:**
```bash
# Copy from .env.example and fill in your tokens
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_API_TOKEN=your_vercel_api_token
```

**2. Restart Claude Code** after adding environment variables for MCP servers to activate.

**3. Next.js DevTools Auto-Init:** When starting work on this project, the Next.js DevTools MCP `init` tool is automatically called to set up proper context with official Next.js documentation.

### MCP Server Configuration

Configuration is stored in `.claude/mcp.json` and checked into version control for team collaboration.

## Architecture Overview

### Dual-Interface Design
The application serves two distinct user groups with different UX patterns:

**1. Public Interface (`app/(public)/`)**
- **Target**: Guards working in the field
- **Layout**: Mobile-first with bottom navigation (Home, Logs, Shifts, Profile)
- **Focus**: Quick actions, touch-optimized, offline-ready
- **Key Features**:
  - Duty management (clock in/out)
  - Quick log creation
  - Shift viewing
  - Location-specific operations

**2. Admin Interface (`app/(admin)/`)**
- **Target**: Supervisors, Admins, Super Admins
- **Layout**: Desktop-optimized with sidebar navigation
- **Focus**: Data management, analytics, bulk operations
- **Key Features**:
  - Dashboard with statistics
  - Comprehensive log management with filters
  - Shift scheduling and calendar
  - Location management (11 marinas)
  - User management and role assignment
  - Incident review workflow

### Authentication & Authorization
- **Provider**: Clerk (via `@clerk/nextjs`)
- **Role-Based Access**: `SUPER_ADMIN`, `ADMIN`, `SUPERVISOR`, `GUARD`
- **Role Storage**: User roles stored in Clerk's `publicMetadata.role`
- **Protected Routes**: All routes require authentication
- **Authorization Utilities**: `lib/utils/auth.ts` - Role hierarchy and permission checks
- **Client Hook**: `lib/hooks/use-current-user.ts` - Access current user and role in components
- **Role-Based Routing**: Handled in page layouts - Guards → `/`, Others → `/admin/dashboard`

### Database Schema (Key Models)

**DutySession** - Core duty tracking model
- Guards: Clock in with specific `locationId`
- Supervisors: Clock in for roaming duty (`locationId = null`)
- Optional link to scheduled `Shift`
- `clockOutTime = null` indicates active duty session

**LocationCheckIn** - Supervisor location verification
- Linked to a `DutySession` (supervisor's active duty)
- Records supervisor check-ins at different locations during roaming duty
- Includes timestamp and optional notes

**Log** - Universal logbook entry
- Types: `INCIDENT`, `PATROL`, `VISITOR_CHECKIN`, `MAINTENANCE`, `WEATHER`, `OTHER`
- Status: `LIVE`, `UPDATED`, `ARCHIVED`, `DRAFT`
- Incident-specific fields: `severity`, `incidentTime`, `peopleInvolved`, `witnesses`, `actionsTaken`, `followUpRequired`
- Review workflow: `reviewedBy`, `reviewedAt`, `reviewNotes` (for supervisor review)

**Shift** - Scheduled work shifts
- Linked to specific `Location`
- Optional `supervisorId` assignment
- Used for shift calendar and duty session linking

**Location** - Marina locations (11 total)
- Can be activated/deactivated via `isActive`
- Core entity for spatial organization

**User** - Authentication and roles
- Linked to Clerk via `clerkId`
- Role determines access level and UI routing

### Server Actions Architecture

**IMPORTANT**: This application uses Next.js Server Actions instead of API routes.

Server Actions are organized by resource in `app/actions/`:
```
app/actions/
  ├── index.ts                  # Centralized exports for all actions
  ├── duty-sessions.ts          # clockIn, clockOut, getCurrentDutySession, getDutySession
  ├── guards-on-duty.ts         # getGuardsOnDuty, forceClockOut
  ├── incidents.ts              # getUnreviewedIncidents, reviewIncident, getIncidentsByStatus
  ├── location-checkins.ts      # checkInToLocation, getLocationCheckIns, getMyRecentCheckIns
  ├── locations.ts              # getLocations, getLocation
  ├── logs.ts                   # getLogs, getLog, createLog, updateLog, deleteLog
  ├── messages.ts               # sendMessage, getMessages
  ├── notifications.ts          # getNotifications, dismissNotification, createSystemNotification
  └── profile.ts                # getMyProfile, getMyDutySessions, getMyLogs, updateMyProfile
```

**Server Action Pattern**: All actions use `'use server'` directive and return typed responses
```typescript
'use server'

export async function actionName(data: ActionInput): Promise<ActionResult> {
  // Authenticate user
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  // Perform operation
  const result = await prisma.model.create({ data })

  // Revalidate paths if needed
  revalidatePath('/path')

  return { success: true, data: result }
}
```

**Import Pattern**: Import actions from centralized index
```typescript
import { clockIn, clockOut, createLog, reviewIncident } from '@/app/actions'
```

### Validation with Zod

Validation schemas are centralized in `lib/validations/`:
- `log.ts` - Log creation/update schemas
- `shift.ts` - Shift scheduling schemas
- `location.ts` - Location management schemas
- `user.ts` - User data schemas
- `incident-report.ts` - Incident-specific schemas

**Usage Pattern**: Use `@hookform/resolvers/zod` for form validation
```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {...}
})
```

## Component Organization

```
components/
  ├── duty/                          # Duty management components
  │   ├── clock-in-dialog.tsx        # Clock in modal
  │   ├── duty-status-card.tsx       # Status display
  │   └── location-checkin-form.tsx  # Supervisor check-ins
  ├── forms/                         # Form components (Log, Shift, Location)
  ├── incidents/                     # Incident-specific components
  │   └── incident-review-dialog.tsx # Review dialog for supervisors
  ├── notifications/                 # Notification system components
  │   └── notification-banner.tsx    # Global notification banner with auto-polling
  ├── supervisor/                    # Supervisor dashboard components
  │   ├── guards-on-duty-table.tsx   # Real-time guard monitoring table
  │   ├── incident-reports-status.tsx # Tabbed incident management interface
  │   └── location-logbook-viewer.tsx # Location-specific log viewer
  ├── shift/                         # Shift calendar (react-big-calendar)
  ├── layouts/
  │   ├── public/                    # Mobile nav (bottom-nav.tsx, mobile-header.tsx)
  │   └── admin/                     # Desktop nav (admin-sidebar.tsx)
  ├── ui/                            # shadcn/ui components
  ├── video-upload.tsx               # Video upload component with Supabase integration
  ├── video-display.tsx              # Video playback component
  ├── theme-provider.tsx             # Theme context provider
  └── theme-toggle.tsx               # Dark/light mode toggle
```

## Key Workflows

### Duty Management Flow
1. **Clock In**: Guard/Supervisor clicks "Report for Duty"
2. **Guard**: Selects specific location → Creates `DutySession` with `locationId`
3. **Supervisor**: Starts roaming duty → Creates `DutySession` with `locationId = null`
4. **Supervisor Check-In**: During roaming, supervisor checks in at locations → Creates `LocationCheckIn` entries
5. **Clock Out**: User clicks "Sign Off Duty" → Sets `clockOutTime` on active `DutySession`

### Incident Review Flow
1. **Guard Creates Incident**: Log with `type = INCIDENT` and optional `severity`
2. **Supervisor Alert**: Unreviewed high-severity incidents appear on supervisor dashboard
3. **Review**: Supervisor adds `reviewNotes`, sets `reviewedBy` and `reviewedAt`
4. **Follow-up**: If `followUpRequired`, incident tracked for further action

### Authorization System

**Authorization Utilities** (`lib/utils/auth.ts`):
- `hasRole(userRole, requiredRole)` - Check role hierarchy
- `canManageResource(userRole, userId, resourceOwnerId)` - Resource ownership check
- `canHardDelete(userRole)` - Super Admin only
- `canManageShifts(userRole)` - Supervisor and above
- `canManageLocations(userRole)` - Admin and above
- `canManageUsers(userRole)` - Admin and above
- `canAccessAppSettings(userRole)` - Super Admin only

**Role Hierarchy**: `SUPER_ADMIN (4) > ADMIN (3) > SUPERVISOR (2) > GUARD (1)`

**Permission Pattern in Server Actions**:
```typescript
'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { hasRole, canManageResource } from '@/lib/utils/auth'

export async function updateResource(id: string, data: UpdateData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'Unauthorized' }

  const user = await currentUser()
  const role = user?.publicMetadata?.role as Role

  const resource = await prisma.resource.findUnique({ where: { id } })

  if (!canManageResource(role, userId, resource.ownerId)) {
    return { success: false, error: 'Forbidden' }
  }

  // Proceed with update
}
```

**Client-Side Hook** (`lib/hooks/use-current-user.ts`):
```typescript
import { useCurrentUser } from '@/lib/hooks/use-current-user'

function Component() {
  const { user, role, isLoaded, isSignedIn } = useCurrentUser()
  // role is extracted from user.publicMetadata.role
}
```

## Styling and UI

- **Framework**: Tailwind CSS v4
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Theme**: Supports dark/light mode via `next-themes`
- **Icons**: `lucide-react`
- **Notifications**: `sonner` toast library
- **Date Handling**: `date-fns` for formatting

## Important Notes

- **Soft Delete**: Most deletions set `archivedAt` timestamp (except Super Admins can hard delete)
- **Record Status**: Logs track status changes: `LIVE` → `UPDATED` → `ARCHIVED`
- **Mobile-First**: Public interface components should prioritize mobile viewports
- **Role-Based Routing**: Handled in page layouts and components (no middleware.ts file)
- **Prisma Client**: Import from `lib/prisma.ts` (singleton instance)
- **Server Actions**: Use `'use server'` directive, always authenticate, revalidate paths when needed
- **Type Safety**: Import types from `@/types` and Prisma generated types
- **Environment Variables**:
  - `DATABASE_URL` - PostgreSQL database connection string
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
  - `CLERK_SECRET_KEY` - Clerk secret key
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (for media storage)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (for media storage)

## Media Upload System

**Supabase Storage Integration** (`lib/supabase.ts`):
- Video upload functionality for incident logs
- Storage bucket: `log-media`
- Auto-generated file names: `{userId}-{timestamp}.{extension}`
- Public URL generation for stored media

**Upload Helper Functions**:
```typescript
import { uploadVideo, deleteVideo } from '@/lib/supabase'

// Upload video file
const videoUrl = await uploadVideo(file, userId)

// Delete video by URL
await deleteVideo(videoUrl)
```

**Components**:
- `components/video-upload.tsx` - File upload interface with progress tracking
- `components/video-display.tsx` - Video playback component

**Integration**: Videos stored in Log model's `videoUrls` field (JSON array as text)

## Messaging System

**Server Actions** (`app/actions/messages.ts`):
- `sendMessage(recipientId, content)` - Send message to another user
- `getMessages(userId)` - Retrieve user's messages

**Use Cases**:
- Supervisors sending instructions to guards
- Guards requesting assistance
- System notifications to users

## Notification System

**Server Actions** (`app/actions/notifications.ts`):
- `getNotifications()` - Fetch user's active notifications
- `dismissNotification(id)` - Mark notification as dismissed
- `createSystemNotification(userId, message, priority)` - Create system notification

**Priority Levels**: `urgent`, `high`, `medium`, `low`

**Auto-Polling**: Notification banner polls every 30 seconds for new notifications

**Component**: `components/notifications/notification-banner.tsx`
- Displays at top of all pages
- Color-coded by priority
- Dismissible by user
- Real-time updates via polling

## Supervisor Features

The supervisor dashboard (`/admin/dashboard`) includes comprehensive management tools:

**Duty Management:**
- Clock in for roaming duty (no specific location)
- Location check-ins during roaming rounds
- View duty status with time tracking

**Guards Monitoring:**
- Real-time table of all guards currently on duty
- Shows guard name, location, clock-in time, hours on duty
- Actions: Send messages to guards, End duty sessions (supervisor override)

**Incident Management:**
- Tabbed interface showing incidents by status: All, Unreviewed, Live, Updated, Archived
- Review workflow for unreviewed incidents
- Severity badges (CRITICAL, HIGH, MEDIUM, LOW)
- One-click review with detailed incident information

**Location Logbook:**
- Select any marina location from dropdown
- View recent log entries specific to that location
- Filter by log type, quick navigation to full logs

**Notifications:**
- Global notification banner displayed at top of all pages
- Auto-polling every 30 seconds for real-time updates
- Priority levels: urgent, high, medium, low (color-coded)
- Dismissible by user
- System-wide announcements and alerts

**Messaging:**
- Direct messaging to guards from supervisor dashboard
- Real-time communication for urgent situations
- Message history and tracking

## Seed Data

Run `npm run db:seed` to populate database with test data:
- 6 Users (Super Admin, Admin, Supervisor, 3 Guards)
- 14 Marina Locations (accurate Town of Islip locations)
- Active duty sessions (3 guards on duty, 1 supervisor roaming)
- Sample incidents (unreviewed and reviewed)
- Various log types (patrol, maintenance, visitor check-ins, weather)

## Development Best Practices

### Working with Server Actions
1. **Always use 'use server' directive** at the top of action files
2. **Authenticate first**: Use `auth()` from `@clerk/nextjs/server` at the start of every action
3. **Return consistent result objects**: `{ success: boolean, data?: T, error?: string }`
4. **Revalidate paths**: Call `revalidatePath()` or `revalidateTag()` after mutations
5. **Handle errors gracefully**: Wrap in try-catch and return user-friendly error messages

### Authorization Pattern
1. **Check authentication**: Verify user is signed in
2. **Extract role**: Get role from `user.publicMetadata.role`
3. **Verify permissions**: Use helper functions from `lib/utils/auth.ts`
4. **Check resource ownership**: For Guards, ensure they own the resource they're modifying

### Component Patterns
1. **Public components**: Mobile-first, touch-optimized, simple navigation
2. **Admin components**: Desktop-optimized, data-dense, complex workflows
3. **Use shadcn/ui**: Leverage existing UI components from `components/ui/`
4. **Client hooks**: Use `useCurrentUser()` for role-based UI rendering
5. **Form validation**: Always use Zod schemas from `lib/validations/`

### Database Operations
1. **Import Prisma client**: `import prisma from '@/lib/prisma'`
2. **Use transactions**: For operations affecting multiple tables
3. **Soft delete**: Set `archivedAt` for most deletions (except Super Admin hard delete)
4. **Include related data**: Use Prisma's `include` for related records
5. **Add indexes**: Consider performance when querying large datasets

## Testing with Playwright

### Overview
The application uses **Playwright** for end-to-end testing, providing comprehensive test coverage across:
- Authentication flows
- Duty management (clock in/out)
- Log creation and management
- Supervisor dashboard features
- Role-based access control
- Mobile and desktop viewports

### Test Structure
```
tests/
├── fixtures/
│   └── auth.ts                  # Authentication fixtures for different roles
├── utils/
│   └── test-helpers.ts          # Helper functions for common operations
├── auth.spec.ts                 # Authentication tests
├── duty-management.spec.ts      # Duty clock in/out tests
├── logs.spec.ts                 # Log creation and management tests
├── supervisor.spec.ts           # Supervisor dashboard tests
└── README.md                    # Detailed testing documentation
```

### Setup Test Environment

**1. Install Playwright browsers:**
```bash
npx playwright install
```

**2. Create test users in Clerk:**
Create users for each role (Guard, Supervisor, Admin, Super Admin) in your Clerk dashboard.

**3. Configure test credentials:**
Add test user credentials to `.env.local`:
```env
TEST_GUARD_EMAIL=guard@test.com
TEST_GUARD_PASSWORD=testpass123

TEST_SUPERVISOR_EMAIL=supervisor@test.com
TEST_SUPERVISOR_PASSWORD=testpass123

TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=testpass123

TEST_SUPER_ADMIN_EMAIL=superadmin@test.com
TEST_SUPER_ADMIN_PASSWORD=testpass123
```

### Running Tests

**Development workflow:**
```bash
# Run tests in UI mode (best for development)
npm run test:ui

# Run specific test file
npx playwright test auth.spec.ts

# Debug failing tests
npm run test:debug
```

**CI/CD workflow:**
```bash
# Run all tests (headless)
npm test

# View HTML report
npm run test:report
```

### Authentication Fixtures

Tests use role-based fixtures for authenticated sessions:

```typescript
import { test, expect } from './fixtures/auth'

// Test with authenticated guard session
test('guard can create logs', async ({ guardPage }) => {
  await guardPage.goto('/logs')
  // guardPage is already authenticated as a guard
})

// Test with authenticated supervisor session
test('supervisor can review incidents', async ({ supervisorPage }) => {
  await supervisorPage.goto('/admin/dashboard')
  // supervisorPage is already authenticated as a supervisor
})
```

**Available fixtures:**
- `guardPage` - Authenticated as Guard
- `supervisorPage` - Authenticated as Supervisor
- `adminPage` - Authenticated as Admin
- `superAdminPage` - Authenticated as Super Admin

### Test Helpers

Common operations are abstracted into helper functions (`tests/utils/test-helpers.ts`):

```typescript
import { clockIn, clockOut, createLog, getDutyStatus } from './utils/test-helpers'

// Clock in as guard
await clockIn(page, 'guard', 'Timber Point Marina')

// Clock in as supervisor (roaming duty)
await clockIn(page, 'supervisor')

// Create a log entry
await createLog(page, 'PATROL', 'Evening Patrol', 'All clear')

// Get current duty status
const status = await getDutyStatus(page) // 'on-duty' | 'off-duty'

// Wait for toast notification
await waitForToast(page, 'Success message')
```

### Writing New Tests

**Basic test pattern:**
```typescript
import { test, expect } from '@playwright/test'

test('test description', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Welcome')
})
```

**Role-based test pattern:**
```typescript
import { test, expect } from './fixtures/auth'
import { clockIn, createLog } from './utils/test-helpers'

test.describe('Guard Workflow', () => {
  test('complete duty cycle', async ({ guardPage }) => {
    // Clock in
    await clockIn(guardPage, 'guard', 'Timber Point Marina')

    // Create log
    await createLog(guardPage, 'PATROL', 'Test Patrol', 'Description')

    // Clock out
    await clockOut(guardPage)
  })
})
```

### Test Coverage

**Authentication (`auth.spec.ts`)**
- Sign in flow
- Redirect unauthenticated users
- Invalid credentials handling

**Duty Management (`duty-management.spec.ts`)**
- Guard clock in to specific location
- Guard clock out
- Supervisor roaming duty
- Supervisor location check-ins
- Validation (e.g., guard must select location)

**Logs (`logs.spec.ts`)**
- Create patrol logs
- Create incident reports with severity
- Create visitor check-ins
- View log history
- Filter logs by type
- Supervisor incident review

**Supervisor Features (`supervisor.spec.ts`)**
- Access dashboard
- View guards on duty
- Send messages to guards
- Force clock out guards
- View incidents by status
- Review incidents
- Access control (guards blocked from admin routes)

### Mobile Testing

Tests automatically run on mobile viewports:
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

```bash
# Run only mobile tests
npm run test:mobile
```

### Best Practices

1. **Use fixtures** - Avoid manual sign-in in every test
2. **Use helpers** - Keep tests DRY with helper functions
3. **Clean up state** - Clock out at the end of duty tests
4. **Wait for events** - Use `waitForToast()`, `waitForSelector()` instead of hard timeouts
5. **Descriptive names** - Clear test descriptions
6. **Group tests** - Use `test.describe()` for related tests
7. **Test both viewports** - Tests run on desktop and mobile automatically

### Debugging Tests

**View traces:**
```bash
npx playwright show-trace trace.zip
```

**Use Playwright Inspector:**
```bash
npm run test:debug
```

**VS Code Extension:**
Install "Playwright Test for VSCode" for inline debugging

### CI/CD Integration

Tests are configured for CI environments:
- 2 retries on failure
- Single worker (sequential execution)
- HTML reporter with screenshots
- Trace on first retry

## Manual Testing Approach

For exploratory testing and development:
- Use Prisma Studio (`npx prisma studio`) for database inspection
- Run seed script to populate test data: `npm run db:seed`
- Test role-based access by switching user roles in Clerk dashboard
- Verify mobile layouts in browser responsive mode
- Test duty workflows: clock in → create logs → clock out cycles
- Test supervisor features: guards monitoring, incident reviews, location check-ins

## Common Patterns & Examples

### Creating a New Server Action
```typescript
'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { hasRole } from '@/lib/utils/auth'
import type { Role } from '@/types'

export async function createResource(data: ResourceInput) {
  // 1. Authenticate
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Get user role
  const user = await currentUser()
  const role = user?.publicMetadata?.role as Role

  // 3. Check permissions
  if (!hasRole(role, 'SUPERVISOR')) {
    return { success: false, error: 'Insufficient permissions' }
  }

  try {
    // 4. Perform operation
    const resource = await prisma.resource.create({
      data: {
        ...data,
        userId,
      },
    })

    // 5. Revalidate affected paths
    revalidatePath('/admin/resources')

    return { success: true, data: resource }
  } catch (error) {
    return { success: false, error: 'Failed to create resource' }
  }
}
```

### Using Server Actions in Components
```typescript
'use client'

import { useState } from 'react'
import { createResource } from '@/app/actions'
import { toast } from 'sonner'

export function ResourceForm() {
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(data: FormData) {
    setIsLoading(true)

    const result = await createResource(data)

    if (result.success) {
      toast.success('Resource created successfully')
    } else {
      toast.error(result.error)
    }

    setIsLoading(false)
  }

  return (
    // Form implementation
  )
}
```
