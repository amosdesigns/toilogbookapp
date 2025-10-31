# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Town of Islip Marina Guard Logbook - A comprehensive security management system for 11 marina locations with dual-interface architecture:
- **Public Frontend** (mobile-first): Guards in the field (`/(public)`)
- **Admin Backend** (desktop-focused): Supervisors/Admins/Super Admins (`/(admin)`)

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
npx prisma studio             # Open database GUI (port 5555)
npx prisma migrate dev        # Create and apply migrations
npx prisma generate           # Generate Prisma client (run after schema changes)
npx prisma db push            # Push schema changes without migration (dev only)
npx prisma db seed            # Seed database (if seed script exists)
```

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
- **Protected Routes**: All routes require authentication
- **Authorization Utilities**: `lib/utils/auth.ts` (e.g., `isAdmin()`, `canModifyLog()`)
- **Role-Based Redirect**: Guards → `/`, Others → `/admin/dashboard`

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

### API Route Pattern

API routes are organized by resource:
```
app/api/
  ├── duty-sessions/
  │   ├── route.ts              # POST (clock in), GET (query sessions)
  │   └── [id]/route.ts         # PATCH (clock out), GET, DELETE
  ├── location-checkins/
  │   └── route.ts              # POST (supervisor check-in)
  └── incidents/
      ├── unreviewed/route.ts   # GET (supervisor alerts)
      └── [id]/review/route.ts  # POST (review incident)
```

**API Response Pattern**: Use Next.js 16 `Response` with appropriate status codes
```typescript
return Response.json({ data }, { status: 200 })
return Response.json({ error: "Message" }, { status: 400 })
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

Run `npm run db:seed` to populate database with test data:
- 6 Users (Super Admin, Admin, Supervisor, 3 Guards)
- 14 Marina Locations (accurate Town of Islip locations)
- Active duty sessions (3 guards on duty, 1 supervisor roaming)
- Sample incidents (unreviewed and reviewed)
- Various log types (patrol, maintenance, visitor check-ins, weather)

## Testing Approach

- Use Prisma Studio (`npx prisma studio`) for database inspection during development
- Run seed script to populate test data: `npm run db:seed`
- Test role-based access by switching user roles in Clerk dashboard
- Verify mobile layouts in browser responsive mode or on actual devices
- Test duty workflows: clock in → create logs → clock out cycles
- Test supervisor features: guards monitoring, incident reviews, location check-ins
