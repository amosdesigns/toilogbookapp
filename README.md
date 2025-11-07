# Town of Islip Marina Guard Logbook App

A comprehensive guard logbook application for managing marina security operations across 11 locations in the Town of Islip.

## Features

- **Multi-Location Support**: Manage logs across 11 different marina locations
- **Role-Based Access Control**: Four distinct user roles with specific permissions
  - **Super Admin**: God-level control with app-wide management capabilities
  - **Admin**: Full control over supervisors, guards, and operations
  - **Supervisor**: Manage shifts and oversee guard activities
  - **Guard**: Create and manage personal logs, view all logs
- **Comprehensive Logging**: Track multiple log types
  - Incidents
  - Patrols
  - Visitor Check-ins
  - Maintenance Issues
  - Weather Conditions
  - Other Events
- **Shift Management**: Supervisors can create and manage shifts
- **Soft Delete**: Archive records instead of permanent deletion (except for Super Admins)
- **Record Tracking**: All records track `createdAt`, `updatedAt`, and `archivedAt` timestamps

## Architecture

The application is built with a **dual-interface architecture** optimized for different user types and devices:

### 📱 Public Frontend (Mobile-First)
**Route Group**: `app/(public)/`
**Target Users**: Guards in the field
**Design Focus**: Mobile-first, touch-optimized interface

- **Bottom Navigation**: Fixed mobile navigation bar with Home, Logs, Shifts, and Profile
- **Mobile Header**: Compact header with user profile access
- **Responsive Design**: Optimized for phone and tablet screens
- **Quick Actions**: Fast access to common tasks (create logs, view shifts)
- **Offline-Ready**: Designed for guards working in areas with poor connectivity

**Pages**:
- `/` - Home dashboard with quick actions
- `/logs` - View and create log entries
- `/shifts` - View shift schedule
- `/profile` - User profile and settings

### 💻 Admin Backend (Desktop-Focused)
**Route Group**: `app/(admin)/`
**Target Users**: Supervisors, Admins, Super Admins
**Design Focus**: Desktop-optimized with rich data tables and management tools

- **Sidebar Navigation**: Full-height sidebar with comprehensive navigation
- **Multi-Panel Layout**: Wide screen layouts for data management
- **Advanced Filters**: Complex filtering and search capabilities
- **Bulk Operations**: Manage multiple records simultaneously
- **Analytics Dashboard**: Overview stats and insights

**Pages**:
- `/admin/dashboard` - Overview and statistics
- `/admin/logs` - Comprehensive log management with filters
- `/admin/shifts` - Shift calendar and scheduling
- `/admin/locations` - Manage 11 marina locations
- `/admin/users` - User management and role assignment
- `/admin/settings` - Application configuration

### 🔐 Authentication Flow
- **Protected Routes**: All routes require authentication via Clerk
- **Role-Based Redirect**:
  - Guards → Public mobile interface (`/`)
  - Supervisors/Admins → Admin desktop panel (`/admin/dashboard`)
- **Sign-In/Sign-Up**: Centralized authentication pages
- **Session Management**: Handled automatically by Clerk

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix UI)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: Clerk
- **Storage**: Supabase Storage (video uploads)
- **Validation**: Zod
- **Forms**: React Hook Form
- **Calendar**: react-big-calendar
- **Notifications**: Sonner
- **Build Tool**: Turbopack (recommended)

## 🚀 Server Actions (Next.js 16 Best Practice)

This application uses **Server Actions** instead of API routes for internal operations, following Next.js 16 best practices.

**Why Server Actions?**
- ✅ Type-safe function calls (no JSON serialization)
- ✅ Built-in revalidation with `revalidatePath()`
- ✅ Better developer experience (less boilerplate)
- ✅ Progressive enhancement (works without JavaScript)
- ✅ React 19 integration (`useActionState`, `useFormStatus`, `useOptimistic`)
- ✅ Automatic error handling and loading states

**Available Server Actions:**
- **Duty Sessions**: `clockIn()`, `clockOut()`, `getCurrentDutySession()`
- **Guards Management**: `getGuardsOnDuty()`, `forceClockOut()`
- **Incidents**: `getUnreviewedIncidents()`, `reviewIncident()`, `getIncidentsByStatus()`
- **Location Check-ins**: `checkInToLocation()`, `getLocationCheckIns()`, `getMyRecentCheckIns()`
- **Notifications**: `getNotifications()`, `dismissNotification()`

**📖 Documentation**: See [SERVER_ACTIONS.md](./SERVER_ACTIONS.md) for detailed documentation, usage examples, and architecture decisions.

## Project Structure

```
toi_project/
├── app/
│   ├── (public)/           # Mobile-first public interface
│   │   ├── logs/          # Log viewing and creation
│   │   ├── shifts/        # Shift schedule viewing
│   │   ├── profile/       # User profile
│   │   ├── layout.tsx     # Mobile layout with bottom nav
│   │   └── page.tsx       # Home dashboard
│   ├── (admin)/           # Desktop-focused admin panel
│   │   ├── dashboard/     # Admin overview
│   │   ├── logs/          # Log management
│   │   ├── shifts/        # Shift management & calendar
│   │   ├── locations/     # Location management
│   │   ├── users/         # User management
│   │   ├── settings/      # App settings
│   │   └── layout.tsx     # Admin layout with sidebar
│   ├── actions/           # ✨ Server Actions (Next.js 16 best practice)
│   │   ├── duty-sessions.ts      # Clock in/out operations
│   │   ├── guards-on-duty.ts     # Monitor active guards
│   │   ├── incidents.ts          # Incident review workflow
│   │   ├── location-checkins.ts  # Supervisor location tracking
│   │   ├── notifications.ts      # System notifications
│   │   └── index.ts              # Centralized exports
│   ├── api/               # API Routes (deprecated - being phased out)
│   ├── sign-in/           # Authentication pages
│   ├── sign-up/
│   ├── layout.tsx         # Root layout with Clerk
│   └── globals.css        # Global styles
├── components/
│   ├── forms/             # Form components (Log, Shift, Location)
│   ├── shift/             # Shift calendar components
│   ├── layouts/           # Layout components
│   │   ├── public/        # Mobile navigation components
│   │   └── admin/         # Admin sidebar components
│   ├── tables/            # Table components
│   ├── video-upload.tsx   # Video upload component
│   ├── video-display.tsx  # Video display component
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   │   └── auth.ts        # Authorization utilities
│   ├── validations/       # Zod validation schemas
│   ├── supabase.ts        # Supabase client (video storage)
│   └── prisma.ts          # Prisma client instance
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── types/                 # TypeScript type definitions
├── proxy.ts               # Clerk authentication middleware
├── SERVER_ACTIONS.md      # 📖 Server Actions documentation
├── VIDEO_UPLOAD_SETUP.md  # 📹 Video upload setup guide
└── CLAUDE.md              # Project guidance for Claude Code
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- A Clerk account and application

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: Your Supabase PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `CLERK_SECRET_KEY`: Clerk secret key

3. Set up the database:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

4. Seed initial data (optional):

Create the 11 marina locations and set up your first Super Admin user.

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### User
- Stores user information linked to Clerk authentication
- Includes role assignment (SUPER_ADMIN, ADMIN, SUPERVISOR, GUARD)

### Location
- Represents the 11 marina locations
- Can be activated/deactivated

### Shift
- Managed by supervisors
- Links to a specific location and optional supervisor

### Log
- Main logbook entries
- Supports multiple types (INCIDENT, PATROL, VISITOR_CHECKIN, MAINTENANCE, WEATHER, OTHER)
- Has status tracking (LIVE, UPDATED, ARCHIVED, DRAFT)
- Links to user, location, and optional shift

## Permissions Matrix

| Action | Guard | Supervisor | Admin | Super Admin |
|--------|-------|------------|-------|-------------|
| View all logs | ✅ | ✅ | ✅ | ✅ |
| Create log | ✅ | ✅ | ✅ | ✅ |
| Update own log | ✅ | ✅ | ✅ | ✅ |
| Update any log | ❌ | ✅ | ✅ | ✅ |
| Soft delete own log | ✅ | ✅ | ✅ | ✅ |
| Soft delete any log | ❌ | ✅ | ✅ | ✅ |
| Hard delete | ❌ | ❌ | ❌ | ✅ |
| Manage shifts | ❌ | ✅ | ✅ | ✅ |
| Manage locations | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ | ✅ |
| App-level settings | ❌ | ❌ | ❌ | ✅ |

## 📹 Video Upload Feature

Guards and supervisors can upload videos to log entries for documentation and evidence:

- **Storage**: Supabase Storage (`log-media` bucket)
- **Max videos per log**: 3
- **Max file size**: 100MB per video
- **Formats**: All video/* types (mp4, mov, avi, webm, etc.)
- **Components**:
  - `VideoUpload` - Upload interface with drag & drop
  - `VideoDisplay` - Video playback with controls

**Setup Required**: You must configure a Supabase Storage bucket before video uploads will work.

See **[VIDEO_UPLOAD_SETUP.md](./VIDEO_UPLOAD_SETUP.md)** for:
- Step-by-step bucket creation
- Storage policies (RLS)
- Environment variable configuration
- Troubleshooting guide

## 📚 Documentation

- **[SERVER_ACTIONS.md](./SERVER_ACTIONS.md)** - Complete Server Actions documentation
  - What are Server Actions and why use them
  - Detailed API reference for all actions
  - Usage examples (forms, optimistic updates)
  - Security and authorization patterns
  - Migration guide from API routes

- **[VIDEO_UPLOAD_SETUP.md](./VIDEO_UPLOAD_SETUP.md)** - Video upload configuration
  - Supabase Storage bucket setup
  - Storage policies and permissions
  - Environment variables
  - Troubleshooting common issues

- **[CLAUDE.md](./CLAUDE.md)** - Project guidance for Claude Code
  - Project overview and architecture
  - Common commands and workflows
  - Database operations
  - Component organization

## Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack

# Build
npm run build        # Build for production
npm start            # Start production server

# Database
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma migrate dev # Create and apply migrations
npx prisma generate  # Generate Prisma client

# Linting
npm run lint         # Run ESLint
```

## 🚀 Next Steps

### Initial Setup

1. **Database Setup**
   - Create Supabase project
   - Copy PostgreSQL connection string to `DATABASE_URL` in `.env.local`
   - Run migrations: `npx prisma migrate dev`

2. **Authentication Setup**
   - Create Clerk application
   - Copy keys to `.env.local`:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`

3. **Video Storage Setup** (Optional but recommended)
   - Create Supabase Storage bucket named `log-media`
   - Configure storage policies (see VIDEO_UPLOAD_SETUP.md)
   - Add Supabase keys to `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Seed Database**
   ```bash
   npm run db:seed
   ```
   This creates:
   - 6 test users (Super Admin, Admin, Supervisor, 3 Guards)
   - 14 marina locations
   - Sample duty sessions and logs

5. **Start Development**
   ```bash
   npm run dev
   ```
   - Guards: http://localhost:3000
   - Admin: http://localhost:3000/admin/dashboard

### Using Server Actions

All data operations use **Server Actions** (not API routes):

```typescript
// Example: Clock in
import { clockIn } from '@/app/actions'

const result = await clockIn({ locationId: 'clx123...' })
if (result.success) {
  console.log('Clocked in!', result.dutySession)
}
```

See [SERVER_ACTIONS.md](./SERVER_ACTIONS.md) for complete usage documentation.

### Deployment to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables from `.env.local`
4. Deploy!

**Important**: Ensure your Supabase database allows connections from Vercel's IP range.
