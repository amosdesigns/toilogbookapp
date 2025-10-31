# Application Architecture

## Overview

The Town of Islip Marina Guard Logbook is built with a **dual-interface architecture**, providing optimized experiences for two distinct user groups:

1. **Mobile-First Public Interface** - For guards in the field
2. **Desktop-Focused Admin Panel** - For supervisors and administrators

## Route Structure

### Route Groups (Next.js 13+ Feature)

We use Next.js route groups (folders in parentheses) to organize our application into two separate sections without affecting the URL structure:

```
app/
├── (public)/     # Public mobile interface - no "public" in URL
└── (admin)/      # Admin desktop panel - keeps "/admin" in URL
```

## Public Interface (Mobile-First)

### Target Users
- **Guards** - Frontline security personnel working in the field

### Design Principles
- Mobile-first responsive design
- Touch-optimized interactions
- Quick access to common tasks
- Minimal data entry
- Offline-capable (future enhancement)

### Layout Components

#### MobileHeader
- Compact header with app title
- User profile button (Clerk UserButton)
- Optional menu button for additional actions

#### MobileNav
- Fixed bottom navigation bar
- 4 primary navigation items:
  - Home
  - Logs
  - Shifts
  - Profile
- Active state highlighting
- Icon + label for clarity

### Pages

#### Home (`/`)
- Welcome message with user name
- Quick action cards:
  - View logs
  - View shifts
- Role-based redirect (admins go to `/admin/dashboard`)

#### Logs (`/logs`)
- List view of recent logs
- Create new log button
- Filter by type, location, date
- Swipe actions for quick operations

#### Shifts (`/shifts`)
- Mobile-optimized shift calendar
- List view of upcoming shifts
- Shift details modal

#### Profile (`/profile`)
- User information
- Settings
- Sign out

## Admin Panel (Desktop-Focused)

### Target Users
- **Supervisors** - Manage shifts and oversee guards
- **Admins** - Full system management except app settings
- **Super Admins** - Complete system control

### Design Principles
- Desktop-optimized layouts
- Rich data tables with sorting/filtering
- Bulk operations
- Comprehensive analytics
- Multi-panel layouts

### Layout Components

#### AdminSidebar
- Full-height collapsible sidebar
- Navigation sections:
  - Dashboard
  - Logs
  - Shifts
  - Locations
  - Users
  - Settings
- Active state highlighting
- User profile in footer
- Collapse toggle

#### SidebarInset
- Main content area
- Responsive padding
- Scrollable content

### Pages

#### Dashboard (`/admin/dashboard`)
- Overview statistics cards:
  - Total logs
  - Active shifts
  - Locations
  - Team members
- Recent activity feed
- Upcoming shifts preview

#### Logs (`/admin/logs`)
- Comprehensive data table
- Advanced filters:
  - Date range
  - Location
  - Type
  - Status
  - User
- Bulk actions (archive, delete)
- Export functionality
- Detailed log view

#### Shifts (`/admin/shifts`)
- Full shift calendar with multiple views
- Create/edit shift forms
- Assign supervisors
- Filter by location/supervisor
- Shift conflict detection

#### Locations (`/admin/locations`)
- Manage 11 marina locations
- CRUD operations
- Active/inactive status
- Address management
- Location analytics

#### Users (`/admin/users`)
- User management table
- Role assignment
- Filter by role
- User activity logs
- Invite new users

#### Settings (`/admin/settings`)
- Application configuration
- Super Admin only features:
  - Hard delete capabilities
  - System-wide settings
  - Backup/restore

## Authentication & Authorization

### Clerk Integration

All routes are protected by Clerk authentication via `proxy.ts` (Next.js 16's replacement for middleware.ts).

### Public Routes
Only the following routes are accessible without authentication:
- `/sign-in`
- `/sign-up`
- `/api/webhooks/*` (for Clerk webhooks)

### Protected Routes
All other routes require authentication and will redirect to `/sign-in` if not authenticated.

### Role-Based Access

#### Permission Levels

```typescript
// Role hierarchy (highest to lowest)
SUPER_ADMIN > ADMIN > SUPERVISOR > GUARD
```

#### Access Matrix

| Feature | Guard | Supervisor | Admin | Super Admin |
|---------|-------|------------|-------|-------------|
| View logs | ✅ | ✅ | ✅ | ✅ |
| Create log | ✅ | ✅ | ✅ | ✅ |
| Edit own log | ✅ | ✅ | ✅ | ✅ |
| Edit any log | ❌ | ✅ | ✅ | ✅ |
| Delete own log (soft) | ✅ | ✅ | ✅ | ✅ |
| Delete any log (soft) | ❌ | ✅ | ✅ | ✅ |
| Hard delete | ❌ | ❌ | ❌ | ✅ |
| View shifts | ✅ | ✅ | ✅ | ✅ |
| Create shifts | ❌ | ✅ | ✅ | ✅ |
| Manage shifts | ❌ | ✅ | ✅ | ✅ |
| Manage locations | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ | ✅ |
| Access admin panel | ❌ | ✅ | ✅ | ✅ |
| App settings | ❌ | ❌ | ❌ | ✅ |

### Role-Based Routing

On successful authentication, users are redirected based on their role:

```typescript
// In app/(public)/page.tsx
const role = user.publicMetadata?.role

if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "SUPERVISOR") {
  redirect("/admin/dashboard")
}
// Guards remain on public interface
```

## Data Flow

### Client-Side Data Fetching

```typescript
// Example: Fetching shifts
const { data: shifts, isLoading } = useQuery({
  queryKey: ['shifts'],
  queryFn: async () => {
    const res = await fetch('/api/shifts')
    return res.json()
  }
})
```

### Server-Side Data Fetching

```typescript
// Example: Server component
export default async function ShiftsPage() {
  const shifts = await prisma.shift.findMany({
    include: {
      location: true,
      supervisor: true,
    }
  })

  return <ShiftCalendar shifts={shifts} />
}
```

### API Routes

```
app/api/
├── logs/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET, PATCH, DELETE
├── shifts/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
├── locations/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
└── users/
    ├── route.ts
    └── [id]/
        └── route.ts
```

## State Management

### Local State
- React `useState` for component-local state
- React Hook Form for form state

### Server State
- React Query / SWR for API data caching
- Optimistic updates for better UX

### Global State
- Clerk for authentication state
- Context API for theme/preferences (if needed)

## Mobile Responsiveness

### Breakpoints

```css
/* Tailwind breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Adaptive Behavior

- Public interface: Optimized for mobile, works on desktop
- Admin interface: Optimized for desktop, functional on tablet, limited on mobile

## Performance Considerations

### Public Interface
- Minimized JavaScript bundle
- Optimized images
- Service worker for offline support (future)
- Progressive Web App capabilities (future)

### Admin Interface
- Code splitting by route
- Lazy loading of heavy components
- Virtual scrolling for large tables
- Debounced search/filter inputs

## Security

### Authentication
- Clerk handles all authentication
- Secure session management
- Automatic token refresh

### Authorization
- Server-side role checks on all API routes
- Client-side role checks for UI rendering
- Database-level row security (via Prisma)

### Data Protection
- Environment variables for secrets
- HTTPS only in production
- CSRF protection via Next.js
- Rate limiting on API routes (future)

## Future Enhancements

### Phase 2
- Real-time updates via WebSockets
- Push notifications for mobile
- Offline mode for guards
- GPS location tagging
- Photo attachments for logs

### Phase 3
- Mobile app (React Native / PWA)
- Advanced analytics dashboard
- Reporting and exports
- Audit logs
- Integration with external systems

## Development Workflow

### Local Development
1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations: `npx prisma migrate dev`
5. Start dev server: `npm run dev`

### Testing
- Unit tests: Vitest / Jest
- Integration tests: Playwright
- E2E tests: Playwright
- Manual testing on target devices

### Deployment
- Production: Vercel
- Database: Supabase (PostgreSQL)
- Authentication: Clerk
- Environment: Production environment variables

## Troubleshooting

### Common Issues

#### Proxy.ts not working
- Ensure Clerk environment variables are set
- Check proxy.ts matcher configuration
- Verify public routes are correctly specified

#### Role-based redirect not working
- Check user.publicMetadata.role is set in Clerk
- Verify redirect logic in page components
- Check Clerk webhook for user creation

#### Mobile navigation not sticky
- Check CSS for `position: fixed`
- Verify z-index is high enough
- Test on actual mobile devices

