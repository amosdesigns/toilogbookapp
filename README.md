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
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: Clerk
- **Validation**: Zod
- **Build Tool**: Turbopack (recommended)

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
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   │   └── auth.ts        # Authorization utilities
│   ├── validations/       # Zod validation schemas
│   └── prisma.ts          # Prisma client instance
├── prisma/
│   └── schema.prisma      # Database schema
├── types/                 # TypeScript type definitions
└── proxy.ts               # Authentication proxy (Next.js 16)
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

## Next Steps

1. Set up your Supabase database and update the `DATABASE_URL`
2. Configure Clerk authentication and update the Clerk environment variables
3. Run database migrations
4. Create initial locations for the 11 marinas
5. Set up your first Super Admin user
6. Build out the UI components and pages
7. Implement API routes for CRUD operations
8. Add form components for creating/editing logs, shifts, and locations
