# Current Architecture: Next.js Monolith

**Last Updated**: 2025-12-30

## Overview

The Town of Islip Marina Guard Logbook is currently built as a Next.js 16 monolithic application using:
- Server-side rendering (SSR)
- Server Actions for backend logic
- Clerk for authentication
- Prisma ORM with PostgreSQL (Supabase)
- Dual-interface design (Public mobile + Admin desktop)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                           │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │   Public UI      │              │    Admin UI      │         │
│  │  (Mobile-first)  │              │ (Desktop-focused)│         │
│  │  /(public)       │              │   /(admin)       │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
└───────────┼──────────────────────────────────┼──────────────────┘
            │                                  │
            └──────────────┬───────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │       Next.js 16 App         │
            │   (SSR + Server Actions)     │
            │                              │
            │  ┌────────────────────────┐  │
            │  │   Clerk Middleware     │  │
            │  │  (Authentication)      │  │
            │  └───────────┬────────────┘  │
            │              │               │
            │  ┌───────────▼────────────┐  │
            │  │   Server Actions       │  │
            │  │  (lib/actions/*.ts)    │  │
            │  │                        │  │
            │  │  - duty-session-actions│  │
            │  │  - guards-actions      │  │
            │  │  - incident-actions    │  │
            │  │  - log-actions         │  │
            │  │  - shift-actions       │  │
            │  │  - user-actions        │  │
            │  │  - location-actions    │  │
            │  │  - notification-actions│  │
            │  │  - tour-actions        │  │
            │  └───────────┬────────────┘  │
            │              │               │
            │  ┌───────────▼────────────┐  │
            │  │    Prisma ORM          │  │
            │  │   (lib/prisma.ts)      │  │
            │  └───────────┬────────────┘  │
            └──────────────┼───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │   PostgreSQL Database        │
            │      (Supabase)              │
            │                              │
            │  - Users                     │
            │  - Locations                 │
            │  - DutySessions              │
            │  - Logs                      │
            │  - Shifts                    │
            │  - Tours                     │
            │  - Notifications             │
            │  - Messages                  │
            │  - SafetyChecklists          │
            └──────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1.1 with React 19
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Forms**: React Hook Form + Zod validation
- **State**: React useState/useEffect (no global state management)
- **Notifications**: Sonner toast library
- **Calendar**: react-big-calendar
- **Date Handling**: date-fns

### Backend (Server-Side)
- **Runtime**: Node.js 22.12+
- **Framework**: Next.js Server Actions
- **ORM**: Prisma 7.0.1
- **Database**: PostgreSQL (hosted on Supabase)
- **Auth**: Clerk (@clerk/nextjs)
- **Validation**: Zod schemas

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Not implemented yet
- **Email**: Not implemented yet

## Current Data Flow

### Example: Creating a Log Entry

```
1. User fills form in LogForm component (client)
   ↓
2. Form submits to createLog Server Action
   ↓
3. Server Action validates with Zod schema
   ↓
4. Server Action checks auth via getCurrentUser()
   ↓
5. Server Action creates record via Prisma
   ↓
6. Database updated (PostgreSQL)
   ↓
7. Server Action returns Result<Log>
   ↓
8. Client receives response, shows toast notification
   ↓
9. Client revalidates page data (Next.js cache)
```

## Authentication Flow

```
1. User visits protected route
   ↓
2. Clerk Middleware checks authentication
   ↓
3. If not authenticated → Redirect to /sign-in
   ↓
4. If authenticated → Allow access
   ↓
5. Server Actions call getCurrentUser() from lib/auth/sync-user.ts
   ↓
6. getCurrentUser() syncs Clerk user to database
   ↓
7. Returns database user with role (GUARD, SUPERVISOR, ADMIN, SUPER_ADMIN)
   ↓
8. Server Action checks permissions based on role
   ↓
9. Performs authorized operation
```

### Clerk Integration
- **User Sync**: Automatic sync from Clerk to database on login
- **Session Management**: Clerk handles sessions via cookies
- **Role Management**: Roles stored in database, NOT in Clerk metadata
- **Authorization**: Role-based access control in Server Actions

## Database Schema (Prisma)

### Key Models

**User**
- Links to Clerk via `clerkId`
- Stores role: `GUARD | SUPERVISOR | ADMIN | SUPER_ADMIN`
- Profile data (name, email, phone, address)

**DutySession**
- Clock in/out tracking
- Guards: linked to specific `locationId`
- Supervisors: roaming duty (`locationId = null`)
- Optional link to scheduled `Shift`

**Log**
- Universal logbook entry
- Types: `INCIDENT`, `PATROL`, `VISITOR_CHECKIN`, `MAINTENANCE`, `WEATHER`, `OTHER`
- Status: `LIVE`, `UPDATED`, `ARCHIVED`, `DRAFT`
- Incident-specific fields (severity, witnesses, actions taken, etc.)

**Location**
- 11 marina locations
- Can be activated/deactivated

**Shift**
- Scheduled work shifts
- Recurring patterns supported
- Optional supervisor assignment

**Tour**
- Supervisor roaming duty with multiple location stops
- Tracks check-ins at each location

See complete schema at: `prisma/schema.prisma`

## Server Actions Inventory

All backend logic is in `lib/actions/`:

1. **duty-session-actions.ts** (6 actions)
   - getActiveDutySession
   - clockIn
   - clockOut
   - createLocationCheckIn
   - checkoutFromLocation
   - endDutySession

2. **guards-actions.ts** (2 actions)
   - getGuardsOnDuty
   - endGuardDutySession

3. **incident-actions.ts** (1 action)
   - reviewIncident

4. **log-actions.ts** (8 actions)
   - getLogs
   - getLogById
   - createLog
   - updateLog
   - deleteLog
   - getIncidents
   - getTotalLogsCount
   - getLocationLogs

5. **shift-actions.ts** (7 actions)
   - getShifts
   - getShiftById
   - createShift
   - updateShift
   - deleteShift
   - createRecurringShifts
   - generateRecurringShifts

6. **user-actions.ts** (3 actions)
   - getUsers
   - getUserById
   - updateUserRole

7. **location-actions.ts** (5 actions)
   - getLocations
   - getActiveLocations
   - createLocation
   - updateLocation
   - toggleLocationActive

8. **notification-actions.ts** (2 actions)
   - getNotifications
   - dismissNotification

9. **tour-actions.ts** (5 actions)
   - getTours
   - getTourById
   - startTour
   - checkInTourStop
   - completeTour

10. **safety-checklist-actions.ts** (2 actions)
    - getSafetyChecklist
    - updateChecklistItemStatus

11. **supervisor-equipment-actions.ts** (3 actions)
    - checkoutEquipment
    - checkinEquipment
    - getEquipmentCheckouts

12. **message-actions.ts** (4 actions)
    - getMessages
    - sendMessage
    - markAsRead
    - deleteMessage

**Total**: ~48 Server Actions to migrate to REST API endpoints

## File Structure

```
app/
├── (public)/              # Public mobile interface
│   ├── page.tsx          # Guard home (duty status)
│   ├── logs/             # Log management
│   ├── shifts/           # Shift calendar
│   ├── messages/         # Messaging
│   └── profile/          # User profile
├── (admin)/              # Admin desktop interface
│   └── dashboard/        # Admin dashboard
│       ├── logs/         # Log management
│       ├── shifts/       # Shift management
│       ├── users/        # User management
│       ├── tours/        # Tour management
│       └── timesheets/   # Timesheet generation
├── api/                  # API routes (minimal use)
│   └── test-notification/
└── sign-in/              # Clerk auth pages
    └── sign-up/

components/
├── duty/                 # Duty management components
├── forms/                # Form components
├── logs/                 # Log display components
├── shift/                # Shift calendar
├── layouts/              # Layout components
└── ui/                   # shadcn/ui components

lib/
├── actions/              # Server Actions (backend logic)
├── auth/                 # Auth utilities
├── utils/                # Utility functions
├── validations/          # Zod schemas
└── types/                # TypeScript types
```

## Strengths of Current Architecture

✅ **Fast Development**: Server Actions are quick to write
✅ **Type Safety**: End-to-end TypeScript
✅ **Simplified Stack**: No separate backend to manage
✅ **Great DX**: Hot reload, fast iteration
✅ **Built-in Optimization**: Next.js handles caching, bundling

## Limitations / Pain Points

❌ **Monolithic**: Frontend and backend tightly coupled
❌ **Vendor Lock-in**: Tightly coupled to Next.js/Vercel
❌ **No API**: Can't expose endpoints to mobile apps or third parties
❌ **Testing Difficulty**: Hard to test Server Actions in isolation
❌ **Scaling Concerns**: All logic runs in single Node.js process
❌ **Limited Reusability**: Can't use backend from other clients
❌ **No RapidAPI Integration**: Server Actions can't be exposed externally

## Migration Challenges

1. **48 Server Actions** need to be converted to REST endpoints
2. **Authentication** needs to work from FastAPI (Clerk JWT validation)
3. **Database Access** needs Python ORM (Prisma → SQLAlchemy)
4. **Frontend Updates** need to replace Server Action calls with fetch/axios
5. **Type Safety** needs to be maintained (TypeScript ↔ Python types)
6. **Deployment** needs to work on AWS instead of Vercel

## Success Criteria for Migration

The new architecture should:
- ✅ Maintain all current functionality
- ✅ Expose REST API for future mobile apps
- ✅ Allow RapidAPI integration
- ✅ Improve testability
- ✅ Enable independent scaling of frontend/backend
- ✅ Teach Python and AWS fundamentals
