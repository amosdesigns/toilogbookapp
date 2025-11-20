# Town of Islip Marina Guard Logbook Application

## Executive Summary

The Town of Islip Marina Guard Logbook is a comprehensive security management system designed to manage operations across 11 marina locations in the Town of Islip, New York. The application features a dual-interface architecture optimized for different user roles: a mobile-first public interface for guards working in the field, and a desktop-focused admin interface for supervisors and administrators.

## Application Overview

### Purpose

The application serves as a centralized platform for:
- Security guard duty management and time tracking
- Incident reporting and review workflows
- Patrol logging and activity documentation
- Visitor check-in management
- Shift scheduling and calendar management
- Real-time monitoring of guards on duty
- Location-based operations across 11 marinas

### Target Users

**Four-Tier User Hierarchy:**

1. **Super Admin** - Full system access, can manage all users, locations, and settings
2. **Admin** - Manages users, locations, and oversees operations
3. **Supervisor** - Reviews incidents, monitors guards, performs roaming duty
4. **Guard** - Field personnel performing security duties at specific marina locations

## Technical Architecture

### Technology Stack

**Frontend:**
- **Framework:** Next.js 16.0.3 with App Router
- **Language:** TypeScript 5.x
- **UI Library:** React 19.2.0
- **Styling:** Tailwind CSS v4 + shadcn/ui components (Radix UI primitives)
- **Forms:** react-hook-form 7.66.1 + Zod 4.1.12 validation
- **Icons:** lucide-react 0.554.0
- **Toast Notifications:** Sonner 2.0.7
- **Date Handling:** date-fns 4.1.0
- **Calendar:** react-big-calendar 1.19.4

**Backend:**
- **Database:** PostgreSQL via Prisma ORM 6.19.0
- **Authentication:** Clerk 6.35.2
- **Storage:** Supabase 2.84.0 (video/media files)
- **API Pattern:** Next.js Server Actions (no separate API routes)

**Testing:**
- **E2E Testing:** Playwright 1.56.1
- **Test Types:** Authentication, duty management, logging, supervisor workflows

**Development Tools:**
- **ESLint:** 9.x with Next.js config
- **TypeScript Compiler:** For type checking
- **Prisma Studio:** Database GUI

### Architecture Patterns

**1. Server Actions Over API Routes**

The application exclusively uses Next.js Server Actions for all backend operations instead of traditional API routes. This provides:
- Simplified data fetching and mutations
- Built-in loading and error states
- Automatic request deduplication
- Type-safe client-server communication

**2. Dual-Interface Design**

The application serves two distinct user experiences:

**Public Interface** (`app/(public)/`)
- **Route:** `/`
- **Layout:** Mobile-first with bottom navigation
- **Navigation Items:** Home, Logs, Shifts, Profile
- **Target Users:** Guards (field personnel)
- **Features:**
  - Quick duty clock in/out
  - Rapid log entry creation
  - Shift viewing
  - Location-specific operations

**Admin Interface** (`app/(admin)/`)
- **Route:** `/admin`
- **Layout:** Desktop-optimized with sidebar navigation
- **Navigation Items:** Dashboard, Logs, Shifts, Locations, Users, Settings
- **Target Users:** Supervisors, Admins, Super Admins
- **Features:**
  - Comprehensive dashboard with analytics
  - Advanced log management with filters
  - Shift scheduling and calendar
  - Location management
  - User management and role assignment
  - Incident review workflow

**3. Role-Based Access Control (RBAC)**

Authorization is handled through:
- **Storage:** User roles stored in Clerk's `publicMetadata.role`
- **Hierarchy:** SUPER_ADMIN (4) > ADMIN (3) > SUPERVISOR (2) > GUARD (1)
- **Utilities:** `lib/utils/auth.ts` provides helper functions for permission checks
- **Client Hook:** `lib/hooks/use-current-user.ts` for component-level access
- **Enforcement:** Server Actions verify permissions on every request

### Database Schema

**Core Models:**

1. **User**
   - Links to Clerk via `clerkId`
   - Role: SUPER_ADMIN, ADMIN, SUPERVISOR, GUARD
   - Profile information: firstName, lastName, email

2. **DutySession**
   - Tracks guard/supervisor duty periods
   - Guards: Must specify `locationId` (specific marina)
   - Supervisors: Can use `locationId = null` (roaming duty)
   - Fields: clockInTime, clockOutTime, notes
   - Optional link to scheduled Shift

3. **LocationCheckIn**
   - Supervisor location verification during roaming duty
   - Links to a DutySession (supervisor's active duty)
   - Records: location, timestamp, notes

4. **Log**
   - Universal logbook entry system
   - Types: INCIDENT, PATROL, VISITOR_CHECKIN, MAINTENANCE, WEATHER, OTHER
   - Status: LIVE, UPDATED, ARCHIVED, DRAFT
   - Incident fields: severity, incidentTime, peopleInvolved, witnesses, actionsTaken
   - Review fields: reviewedBy, reviewedAt, reviewNotes
   - Media: videoUrls (JSON array)

5. **Shift**
   - Scheduled work shifts
   - Links to specific Location
   - Optional supervisorId assignment
   - Used for calendar display and duty session linking

6. **Location**
   - 11 marina locations in Town of Islip
   - Fields: name, address, isActive
   - Core entity for spatial organization

7. **Notification**
   - System notifications for users
   - Priority levels: urgent, high, medium, low
   - Auto-polling every 30 seconds

8. **Message**
   - Direct messaging between users
   - Supervisor-to-guard communication

## Key Features

### 1. Duty Management

**Guard Clock In:**
- Select specific marina location
- Creates DutySession with locationId
- Optional link to scheduled shift
- Validates: Only one active session per user

**Supervisor Clock In:**
- Roaming duty (no specific location)
- Creates DutySession with locationId = null
- Can check in at multiple locations during duty

**Location Check-Ins:**
- Supervisors verify presence at locations
- Creates LocationCheckIn entries
- Links to active DutySession

**Clock Out:**
- Sets clockOutTime on active DutySession
- Calculates total duty hours
- Optional notes field

### 2. Log Management

**Log Types:**
- **INCIDENT:** Security incidents with severity levels
- **PATROL:** Routine patrol documentation
- **VISITOR_CHECKIN:** Visitor registration
- **MAINTENANCE:** Maintenance observations
- **WEATHER:** Weather-related notes
- **OTHER:** Miscellaneous entries

**Incident-Specific Features:**
- Severity: CRITICAL, HIGH, MEDIUM, LOW
- Incident time tracking
- People involved documentation
- Witness information
- Actions taken
- Follow-up tracking

**Log Workflow:**
- Create: Guard creates log entry
- Update: Edit existing entry (status changes to UPDATED)
- Archive: Soft delete (status changes to ARCHIVED)
- Review: Supervisor adds review notes

### 3. Incident Review Workflow

**Process:**
1. Guard creates incident log with severity
2. High-severity incidents appear on supervisor dashboard
3. Supervisor reviews incident details
4. Supervisor adds review notes
5. System records: reviewedBy, reviewedAt
6. Follow-up flag for ongoing incidents

**Dashboard Views:**
- Unreviewed incidents
- All incidents
- Filter by status: Live, Updated, Archived
- Severity badges for quick identification

### 4. Shift Scheduling

**Features:**
- Calendar view using react-big-calendar
- Month, week, day views
- Shift creation and editing
- Location assignment
- Optional supervisor assignment
- Integration with duty sessions

### 5. Guards Monitoring (Supervisor Dashboard)

**Real-Time Monitoring:**
- Table showing all guards currently on duty
- Displays: Name, location, clock-in time, hours on duty
- Actions:
  - Send message to guard
  - Force clock out (supervisor override)
- Auto-updates with current time calculations

### 6. Location Management

**11 Marina Locations:**
1. Timber Point Marina
2. Salty Dog Marina
3. Captree Boat Basin
4. East Islip Marina
5. Great River Marina
6. Heckscher State Park Marina
7. Idle Hour Marina
8. Ocean Beach Marina
9. Oakdale Marina
10. West Sayville Marina
11. Bay Shore Marina

**Management Features:**
- Activate/deactivate locations
- Edit location details
- View location-specific logs
- Location-based duty assignments

### 7. Notification System

**Features:**
- Global notification banner
- Auto-polling every 30 seconds
- Priority-based color coding
- Dismissible notifications
- System-wide announcements

### 8. Media Upload

**Video Support:**
- Supabase storage integration
- Video upload for incident documentation
- Video playback component
- Auto-generated file names
- Public URL generation

### 9. Messaging

**Direct Communication:**
- Supervisor-to-guard messaging
- Real-time delivery
- Message history tracking

## User Workflows

### Guard Daily Workflow

1. **Start Shift:**
   - Navigate to home page
   - Click "Report for Duty"
   - Select marina location
   - Confirm clock in

2. **During Shift:**
   - Create patrol logs
   - Document incidents
   - Record visitor check-ins
   - Note maintenance issues

3. **End Shift:**
   - Click "Sign Off Duty"
   - Confirm clock out
   - Session logged with total hours

### Supervisor Daily Workflow

1. **Start Duty:**
   - Clock in for roaming duty
   - No specific location required

2. **During Duty:**
   - Monitor guards on duty dashboard
   - Review unreviewed incidents
   - Check in at various locations
   - Send messages to guards
   - Review and approve logs

3. **Incident Review:**
   - View incident reports by status
   - Open incident details
   - Add review notes
   - Mark follow-up if needed

4. **End Duty:**
   - Clock out from roaming duty
   - Review day's activities

### Admin Workflow

- User management: Create, edit, assign roles
- Location management: Activate, deactivate, edit
- Shift scheduling: Create and assign shifts
- System oversight: Monitor all activities
- Report generation: View logs across all locations

## Authentication & Authorization

### Clerk Integration

**Setup:**
- Clerk provides authentication infrastructure
- User sign-up and sign-in flows
- Session management
- Protected routes

**Role Assignment:**
- Roles stored in Clerk's publicMetadata
- Format: `publicMetadata.role = "GUARD" | "SUPERVISOR" | "ADMIN" | "SUPER_ADMIN"`
- Updated via Clerk dashboard or admin interface

### Permission System

**Helper Functions** (`lib/utils/auth.ts`):

```typescript
hasRole(userRole, requiredRole) // Check role hierarchy
canManageResource(userRole, userId, resourceOwnerId) // Resource ownership
canHardDelete(userRole) // Super Admin only
canManageShifts(userRole) // Supervisor+
canManageLocations(userRole) // Admin+
canManageUsers(userRole) // Admin+
canAccessAppSettings(userRole) // Super Admin only
```

**Server Action Pattern:**
```typescript
'use server'
export async function protectedAction() {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'Unauthorized' }

  const user = await currentUser()
  const role = user?.publicMetadata?.role

  if (!hasRole(role, 'SUPERVISOR')) {
    return { success: false, error: 'Insufficient permissions' }
  }

  // Perform action
}
```

## Testing Strategy

### Playwright E2E Tests

**Test Coverage:**

1. **Authentication** (`tests/auth.spec.ts`)
   - Sign in flow
   - Redirect unauthenticated users
   - Invalid credentials handling

2. **Duty Management** (`tests/duty-management.spec.ts`)
   - Guard clock in/out
   - Supervisor roaming duty
   - Location check-ins
   - Validation tests

3. **Logs** (`tests/logs.spec.ts`)
   - Create logs by type
   - Incident reports with severity
   - View log history
   - Filter functionality

4. **Supervisor Features** (`tests/supervisor.spec.ts`)
   - Dashboard access
   - Guards monitoring
   - Incident review
   - Send messages
   - Force clock out

**Test Infrastructure:**

**Fixtures** (`tests/fixtures/auth.ts`):
- `guardPage` - Authenticated as Guard
- `supervisorPage` - Authenticated as Supervisor
- `adminPage` - Authenticated as Admin
- `superAdminPage` - Authenticated as Super Admin

**Helpers** (`tests/utils/test-helpers.ts`):
- `clockIn(page, role, location?)` - Clock in helper
- `clockOut(page)` - Clock out helper
- `createLog(page, type, title, description)` - Log creation
- `getDutyStatus(page)` - Get current duty state
- `waitForToast(page, message?)` - Wait for notifications

**Running Tests:**
```bash
npm test              # Run all tests
npm run test:ui       # UI mode (development)
npm run test:headed   # Headed mode (see browser)
npm run test:debug    # Debug with Inspector
npm run test:mobile   # Mobile viewports
npm run test:report   # View HTML report
```

## Development Workflow

### Environment Setup

**1. Install dependencies:**
```bash
npm install
```

**2. Configure environment variables:**
Copy `.env.example` to `.env.local` and update:
- `DATABASE_URL` - PostgreSQL connection
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase key
- Test user credentials for Playwright

**3. Database setup:**
```bash
npx prisma migrate dev    # Run migrations
npx prisma generate       # Generate Prisma client
npm run db:seed           # Seed test data (optional)
```

**4. Start development server:**
```bash
npm run dev
```

### Development Commands

**Development:**
- `npm run dev` - Start dev server (http://localhost:3000)
- `npm run build` - Production build
- `npm start` - Start production server

**Database:**
- `npx prisma studio` - Open database GUI (port 5555)
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma generate` - Regenerate Prisma client
- `npx prisma db push` - Push schema without migration (dev only)
- `npm run db:seed` - Seed database

**Code Quality:**
- `npm run typecheck` - TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run validate` - Run typecheck + lint (use after code changes)

**Testing:**
- `npm test` - Run all Playwright tests
- `npm run test:ui` - Playwright UI mode
- `npm run test:headed` - Run with visible browser

### Code Organization

```
toilogbookapp/
├── app/
│   ├── (admin)/                 # Admin interface routes
│   │   ├── dashboard/
│   │   ├── logs/
│   │   ├── shifts/
│   │   ├── locations/
│   │   └── users/
│   ├── (public)/                # Public interface routes
│   │   ├── page.tsx             # Home (guards)
│   │   ├── logs/
│   │   ├── shifts/
│   │   └── profile/
│   ├── actions/                 # Server Actions (backend logic)
│   │   ├── index.ts             # Centralized exports
│   │   ├── duty-sessions.ts
│   │   ├── logs.ts
│   │   ├── incidents.ts
│   │   └── ...
│   └── layout.tsx               # Root layout
├── components/
│   ├── duty/                    # Duty management components
│   ├── forms/                   # Form components
│   ├── incidents/               # Incident components
│   ├── notifications/           # Notification system
│   ├── supervisor/              # Supervisor dashboard
│   ├── shift/                   # Shift calendar
│   ├── layouts/                 # Layout components
│   │   ├── public/              # Mobile navigation
│   │   └── admin/               # Admin sidebar
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── prisma.ts                # Prisma client singleton
│   ├── supabase.ts              # Supabase client
│   ├── utils/
│   │   └── auth.ts              # Authorization helpers
│   ├── hooks/
│   │   └── use-current-user.ts  # User hook
│   └── validations/             # Zod schemas
│       ├── log.ts
│       ├── shift.ts
│       └── ...
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Migration history
│   └── seed.ts                  # Seed data
├── tests/
│   ├── fixtures/                # Playwright fixtures
│   ├── utils/                   # Test helpers
│   └── *.spec.ts                # Test files
├── public/                      # Static assets
├── CLAUDE.md                    # Project instructions for Claude Code
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── eslint.config.mjs
└── playwright.config.ts
```

## Data Flow Examples

### Creating an Incident Log

**1. User Action (Client):**
```typescript
// components/forms/incident-report-form.tsx
const onSubmit = async (data: FormData) => {
  const result = await createLog(data)
  if (result.success) {
    toast.success('Incident reported')
    router.push('/logs')
  }
}
```

**2. Server Action (Backend):**
```typescript
// app/actions/logs.ts
'use server'
export async function createLog(data: LogInput) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'Unauthorized' }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })

  const log = await prisma.log.create({
    data: {
      ...data,
      userId: user.id,
      status: 'LIVE'
    }
  })

  revalidatePath('/logs')
  revalidatePath('/admin/logs')

  return { success: true, data: log }
}
```

**3. Database Update:**
- Prisma creates new Log record
- Relations: User, Location

**4. UI Update:**
- Server Action returns success
- Client shows toast notification
- Route revalidation triggers fresh data

### Supervisor Reviewing Incident

**1. Dashboard Display:**
- Fetch unreviewed incidents via Server Action
- Display in tabbed interface
- Show severity badges

**2. Review Action:**
```typescript
// app/actions/incidents.ts
'use server'
export async function reviewIncident(incidentId: string, notes: string) {
  const { userId } = await auth()
  const user = await currentUser()
  const role = user?.publicMetadata?.role

  if (!hasRole(role, 'SUPERVISOR')) {
    return { success: false, error: 'Forbidden' }
  }

  const incident = await prisma.log.update({
    where: { id: incidentId },
    data: {
      reviewedBy: userId,
      reviewedAt: new Date(),
      reviewNotes: notes
    }
  })

  revalidatePath('/admin/dashboard')
  return { success: true, data: incident }
}
```

**3. Notification:**
- Create notification for incident creator
- Auto-polling delivers notification within 30 seconds

## Performance Considerations

### Optimization Strategies

1. **Server Components by Default**
   - Most components are React Server Components
   - Client components only when needed (forms, interactivity)

2. **Data Caching**
   - Next.js automatic request deduplication
   - Prisma connection pooling
   - Selective revalidation with revalidatePath()

3. **Database Queries**
   - Efficient Prisma queries with includes
   - Index on frequently queried fields
   - Pagination for large datasets

4. **Image/Video Optimization**
   - Supabase CDN for media files
   - Lazy loading for video components

5. **Mobile Performance**
   - Mobile-first CSS
   - Touch-optimized interfaces
   - Minimal JavaScript on public routes

## Security Considerations

### Best Practices Implemented

1. **Authentication**
   - Clerk handles authentication securely
   - Session-based access control
   - Protected routes by default

2. **Authorization**
   - Server-side permission checks
   - Role-based access control
   - Resource ownership validation

3. **Data Protection**
   - SQL injection prevention via Prisma
   - XSS protection via React
   - CSRF protection built into Next.js

4. **Soft Deletes**
   - Archive instead of hard delete
   - Super Admin can hard delete
   - Audit trail preservation

5. **Environment Variables**
   - Secrets in .env.local (not committed)
   - Client-side vars prefixed with NEXT_PUBLIC_
   - Production secrets in hosting platform

## Deployment

### Recommended Hosting

**Vercel (Recommended):**
- Native Next.js support
- Automatic deployments from Git
- Edge network for optimal performance
- Environment variable management

**Database:**
- PostgreSQL on Supabase, Railway, or Neon
- Connection pooling enabled
- Regular backups

**Media Storage:**
- Supabase Storage (current implementation)
- CDN for fast delivery

### Environment Variables (Production)

Required:
- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional (for MCP integration):
- `GITHUB_PERSONAL_ACCESS_TOKEN`
- `VERCEL_API_TOKEN`

### Build Process

```bash
npm run build      # Generates production build
npm start          # Starts production server
```

Build includes:
- TypeScript compilation
- Prisma client generation
- Static page generation
- Asset optimization

## Future Enhancements

### Potential Features

1. **Analytics Dashboard**
   - Incident trends over time
   - Guard performance metrics
   - Location activity heatmaps

2. **Mobile App**
   - Native iOS/Android apps
   - Offline capability
   - Push notifications

3. **Advanced Reporting**
   - PDF report generation
   - Custom report builder
   - Export to CSV/Excel

4. **Integration APIs**
   - Third-party integrations
   - Webhook support
   - Public API for external systems

5. **Communication Enhancements**
   - Real-time chat
   - Group messaging
   - Alert broadcasting

6. **Scheduling Improvements**
   - Auto-scheduling algorithms
   - Shift swap requests
   - Overtime tracking

7. **Geolocation Features**
   - GPS-based check-ins
   - Location verification
   - Patrol route tracking

## Troubleshooting

### Common Issues

**1. Prisma Client Not Generated:**
```bash
npx prisma generate
```

**2. Database Connection Errors:**
- Check DATABASE_URL in .env.local
- Verify PostgreSQL is running
- Test connection with Prisma Studio

**3. Authentication Issues:**
- Verify Clerk keys in .env.local
- Check Clerk dashboard for configuration
- Ensure user roles are set in publicMetadata

**4. Build Failures:**
```bash
npm run validate   # Check for type/lint errors
npm run typecheck  # TypeScript errors
npm run lint       # ESLint errors
```

**5. Test Failures:**
- Ensure test users exist in Clerk
- Check test credentials in .env.local
- Run dev server before tests

## Support & Maintenance

### Code Quality Standards

- TypeScript strict mode
- ESLint with Next.js config
- Consistent code formatting
- Comprehensive testing
- Documentation in code

### Version Control

- Git for source control
- Feature branch workflow
- Pull request reviews
- Semantic versioning

### Monitoring

- Server action error logging
- Client-side error boundaries
- Performance monitoring (optional: Vercel Analytics)

## Conclusion

The Town of Islip Marina Guard Logbook is a production-ready, scalable security management system built with modern web technologies. It provides comprehensive features for duty management, incident reporting, and supervisor oversight across multiple marina locations. The dual-interface architecture ensures optimal user experience for both field guards and administrative staff.

The application is built with best practices in mind, including strong type safety, comprehensive testing, role-based access control, and a clear separation of concerns. The codebase is well-documented and maintainable, making it easy for developers to understand and extend the functionality.

---

**Last Updated:** November 20, 2025
**Version:** 0.1.0
**Dependencies Updated:** Next.js 16.0.3, React 19.2.0, Prisma 6.19.0, Clerk 6.35.2, and all other packages to latest stable versions
