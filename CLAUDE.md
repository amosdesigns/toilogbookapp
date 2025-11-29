# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL RULES

### 1. NO `any` TYPES - EVER

This codebase maintains **ZERO tolerance for `any` types**. See `/docs/typescript-conventions.md` for complete guidelines.

**Key Points:**

- ✅ Use proper TypeScript interfaces and types
- ✅ Use `Result<T>` for all server actions
- ✅ Use `Resolver<T>` for React Hook Form
- ✅ Use `unknown` instead of `any` for truly unknown data
- ❌ NEVER use `any` - no exceptions

### 2. Server Actions ONLY (No API Routes)

All database operations use Next.js Server Actions located in `/lib/actions/`. Never create API routes for database interactions.

## Project Overview

Town of Islip Marina Guard Logbook - A comprehensive security management system for 11 marina locations with dual-interface architecture:

- **Public Frontend** (mobile-first): Guards in the field (`/(public)`)
- **Admin Backend** (desktop-focused): Supervisors/Admins/Super Admins (`/(admin)`)

## Technical Requirements

- **Node.js**: 22.12+ (required for Prisma 7)
- **Next.js**: 16.0.3
- **Prisma**: 7.0.0
- **Database**: PostgreSQL

**Important**: This project uses Prisma 7 which requires Node.js 22.12+. If using nvm:

```bash
nvm use 22  # Switch to Node 22
```

## Common Commands

### Development

```bash
npm run dev            # Start dev server
npm run build          # Build for production
npm start              # Start production server
npm run lint           # Run ESLint
```

### Database Operations

```bash
# Prisma Studio - GUI database browser
# Note: Prisma 7 requires passing --url flag explicitly
npx prisma studio --url "postgresql://postgres.qnhcymavgkchvymkkktr:[databasepasword]@C29@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# With nvm (recommended for Node 22):
nvm use 22 && npx prisma studio --url "postgresql://postgres.qnhcymavgkchvymkkktr:[password]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Other Prisma commands
npx prisma migrate dev        # Create and apply migrations
npx prisma generate           # Generate Prisma client (run after schema changes)
npx prisma db push            # Push schema changes without migration (dev only)
npx prisma db seed            # Seed database with 22 test users
```

### Prisma 7 Configuration

Prisma 7 uses a separate configuration file for datasource connection:

- **Schema**: `prisma/schema.prisma` (defines models and generator)
- **Config**: `prisma/prisma.config.ts` (defines datasource connection URL)

## Architecture Overview

### **CRITICAL: Server Actions vs API Routes**

⚠️ **This application uses Next.js 16 Server Actions for ALL database operations. DO NOT create API routes for database interactions.**

**Always use Server Actions for:**

- Database queries (read operations)
- Database mutations (create, update, delete)
- Authentication checks
- Permission verification
- Any server-side business logic

**Server Action Pattern with Result&lt;T&gt; Type:**

```typescript
'use server' // Required at top of file

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/sync-user'
import { revalidatePath } from 'next/cache'
import { to, type Result } from '@/lib/utils/RenderError'

// All actions MUST return Result<T>
export async function myAction(data: any): Promise<Result<MyReturnType>> {
  try {
    // 1. Authenticate
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // 2. Check permissions
    if (!canPerformAction(user.role)) {
      return { ok: false, message: 'Forbidden' }
    }

    // 3. Validate input with Zod
    const validation = schema.safeParse(data)
    if (!validation.success) {
      return {
        ok: false,
        message: 'Invalid data',
        meta: { errors: validation.error.flatten() }
      }
    }

    // 4. Perform database operation
    const result = await prisma.model.create({
      data: validation.data
    })

    // 5. Revalidate cache to update UI
    revalidatePath('/path/to/page')

    // 6. Return success with data
    return {
      ok: true,
      data: result,
      message: 'Operation successful' // optional
    }
  } catch (error) {
    // 7. Use 'to()' helper for error handling
    console.error('Action error:', error)
    return to(error)
  }
}
```

**Result&lt;T&gt; Type Definition:**

```typescript
// Success case
{ ok: true, data: T, message?: string }

// Error case
{ ok: false, message: string, code?: string, meta?: Record<string, unknown> }
```

**File Organization:**

- Place all Server Actions in `lib/actions/`
- One file per resource (e.g., `log-actions.ts`, `user-actions.ts`, `shift-actions.ts`)
- Export individual action functions

**Existing Server Actions:**

- `duty-session-actions.ts` - Duty session CRUD operations
- `guards-actions.ts` - Guards on duty tracking
- `incident-actions.ts` - Incident review operations
- `location-actions.ts` - Location CRUD operations
- `log-actions.ts` - Log CRUD operations
- `shift-actions.ts` - Shift and recurring pattern management
- `user-actions.ts` - User authentication and data retrieval
- `safety-checklist-actions.ts` - Safety checklist operations

**Client Usage with Result&lt;T&gt;:**

```typescript
'use client'
import { myAction } from '@/lib/actions/resource'
import { toast } from 'sonner'

// In component
const handleSubmit = async (data) => {
  const result = await myAction(data)

  // Check result.ok instead of result.error
  if (!result.ok) {
    toast.error(result.message)
    // Optional: access validation errors
    if (result.meta?.errors) {
      console.error('Validation errors:', result.meta.errors)
    }
  } else {
    // Access data with result.data
    console.log('Success:', result.data)
    toast.success(result.message || 'Success!')
  }
}
```

**Error Handling Helpers:**

```typescript
import { to, isOk, unwrap, getOrElse } from '@/lib/utils/RenderError'

// to() - Convert any error to Result format (use in catch blocks)
return to(error)

// isOk() - Type guard
if (isOk(result)) {
  console.log(result.data) // TypeScript knows this is safe
}

// unwrap() - Get data or throw (use when you're certain it succeeded)
const data = unwrap(result)

// getOrElse() - Get data or fallback
const data = getOrElse(result, [])
```

**When to use API routes (`app/api/`):**

- Webhooks (external services calling your app)
- Third-party integrations
- Public APIs for external consumers
- **NEVER for internal database operations**

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
- **Protected Routes**: All routes require authentication
- **Authorization Utilities**: `lib/utils/auth.ts` (e.g., `isAdmin()`, `canModifyLog()`)
- **Role-Based Redirect**: Guards → `/`, Others → `/admin/dashboard`

**IMPORTANT: Role Management Architecture**

- **Roles are ONLY managed in the database** - The database is the single source of truth
- **NEVER use Clerk's `publicMetadata.role`** for authorization checks
- **Server Components**: Use `getCurrentUser()` from `lib/auth/sync-user.ts` to get user with database role
- **Client Components**: Pass role as prop from server component, never read from Clerk directly
- Clerk is used for authentication only, NOT for authorization
- The `syncUserToDatabase()` function syncs user info FROM Clerk TO database, but does NOT sync roles back to Clerk

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

### ~~API Route Pattern~~ (Deprecated - Use Server Actions Instead)

⚠️ **IMPORTANT**: This section is kept for reference only. All database operations now use Server Actions in `lib/actions/`.

**Server Actions are located in:**

```text
lib/actions/
  ├── logs.ts              # Log CRUD operations
  ├── users.ts             # User operations
  ├── locations.ts         # Location operations
  ├── duty-sessions.ts     # Duty session management
  └── [resource].ts        # One file per resource
```

**Do NOT create new API routes for database operations.** Only use `app/api/` for:

- External webhooks
- Third-party integrations
- Public APIs

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

```text
components/
  ├── duty/                 # Duty management components
  │   ├── clock-in-dialog.tsx       # Clock in modal
  │   ├── duty-status-card.tsx      # Status display
  │   └── location-checkin-form.tsx # Supervisor check-ins
  ├── forms/                # Form components (Log, Shift, Location)
  ├── shift/                # Shift calendar (react-big-calendar)
  ├── layouts/
  │   ├── public/           # Mobile nav (bottom-nav.tsx, mobile-header.tsx)
  │   └── admin/            # Desktop nav (admin-sidebar.tsx)
  ├── tables/               # Data tables
  └── ui/                   # shadcn/ui components
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

### Permission Checks

Always verify permissions before mutations:

```typescript
// Example pattern
const user = await getCurrentUser()
if (log.userId !== user.id && !isAdmin(user.role)) {
  return Response.json({ error: "Unauthorized" }, { status: 403 })
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
- **Role-Based Routing**: Use middleware or layout checks to redirect users based on role
- **Prisma Client**: Import from `lib/prisma.ts` (singleton instance)
- **Environment**: Requires `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

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

- Global notification system displayed at top of all pages
- Auto-polling every 30 seconds
- Priority levels: urgent, high, medium, low
- Dismissible notifications

## Seed Data

Run `npm run db:seed` to populate database with comprehensive test data:

- **22 Users** (2 Super Admins, 2 Admins, 4 Supervisors, 14 Guards)
- **14 Marina Locations** (accurate Town of Islip locations)
- **Recurring Shift Patterns** for next 30 days with assignments
- **Active duty sessions** (3 guards on duty at Atlantique Marina, 1 supervisor roaming)
- **Sample incidents** (unreviewed and reviewed with varying severity levels)
- **Various log types** (patrol, maintenance, visitor check-ins, weather, incidents)
- **Assets, Visitors, Equipment, Maintenance Requests, Alerts**
- **8 Safety Checklist Items** for on-duty checklist

All 22 users have diverse log entries across different locations and time periods to simulate realistic usage patterns.

## Testing Approach

- Use Prisma Studio (`npx prisma studio`) for database inspection during development
- Run seed script to populate test data: `npm run db:seed`
- Test role-based access by switching user roles in Clerk dashboard
- Verify mobile layouts in browser responsive mode or on actual devices
- Test duty workflows: clock in → create logs → clock out cycles
- Test supervisor features: guards monitoring, incident reviews, location check-ins
- always


## Documentation

### Key Documentation Files

- **`/docs/typescript-conventions.md`** - TypeScript rules, NO any types policy, Result&lt;T&gt; pattern
- **`/docs/user-management.md`** - User management feature documentation
- **`CLAUDE.md`** - This file, main project guidance
- **`.mcp/server.json`** - MCP server configuration for AI context

### MCP Server

This project includes an MCP (Model Context Protocol) server configuration at `.mcp/server.json` to provide Claude Code with enhanced context about:

- Database schema
- Server actions structure
- Component hierarchy
- Architecture patterns
- Code conventions

The MCP server helps Claude Code understand the project structure and provide better assistance during development.
