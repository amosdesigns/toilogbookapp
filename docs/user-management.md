# User Management Feature Documentation

## Overview
The User Management feature provides administrators with comprehensive control over user accounts, including role management and user archival. This feature is accessible only to users with ADMIN and SUPER_ADMIN roles.

## Access Control

### Route Access
- **Path**: `/dashboard/users`
- **Allowed Roles**: `SUPER_ADMIN`, `ADMIN`
- **Redirect**: All other roles are redirected to `/`

### Permission Matrix

| Action | GUARD | SUPERVISOR | ADMIN | SUPER_ADMIN |
|--------|-------|------------|-------|-------------|
| View User Management Page | ❌ | ❌ | ✅ | ✅ |
| Search Users | ❌ | ❌ | ✅ | ✅ |
| View User Details | ❌ | ❌ | ✅ | ✅ |
| Update User Role | ❌ | ❌ | ✅ | ✅ |
| Archive User | ❌ | ❌ | ✅ | ✅ |
| Unarchive User | ❌ | ❌ | ❌ | ✅ |
| Hard Delete User | ❌ | ❌ | ❌ | ❌ (Never allowed) |

## Features

### 1. User List Table
Displays all users in the system with the following information:
- **Name**: Full name (firstName + lastName) with optional username
- **Email**: User's email address
- **Role**: Color-coded badge showing user role
- **Phone**: Contact phone number
- **Address**: Street address, city, state, zip code
- **Created**: Account creation date
- **Status**: Active or Archived with timestamp
- **Actions**: Role selector, Archive/Unarchive buttons

### 2. Role Management
Administrators can update user roles through an inline select dropdown.

#### Role Colors
- **SUPER_ADMIN**: Red badge
- **ADMIN**: Orange badge
- **SUPERVISOR**: Blue badge
- **GUARD**: Green badge

### 3. User Archival System

#### Archive User
- **Who Can Archive**: ADMIN and SUPER_ADMIN
- **Cannot Archive**: Self (prevents accidental lockout)
- **Effects**:
  - Sets `archivedAt` timestamp in database
  - Updates Clerk metadata with `archived: true` flag
  - User appears grayed out in table with "ARCHIVED" badge
  - User prevented from logging in (checked via proxy middleware)

#### Unarchive User
- **Who Can Unarchive**: SUPER_ADMIN only
- **Effects**:
  - Clears `archivedAt` timestamp in database
  - Removes `archived` flag from Clerk metadata
  - User regains login access
  - User appears normal in table with "ACTIVE" badge

#### No Hard Deletes
- Users are **never** hard-deleted from the database
- This preserves log integrity and historical records
- Archived users retain all their associated logs, duty sessions, etc.

### 4. Search Functionality
- **Search By**: Name (first/last) and/or email
- **Type**: Click-to-search
- **Features**:
  - Case-insensitive search
  - Partial matching
  - Clear search button to reset
  - Enter key support

### 5. Pagination
- **Page Size**: 25 users per page
- **Controls**: Previous/Next buttons
- **Display**: Shows current page and total pages
- **Behavior**: Resets to page 1 on new search

### 6. Statistics Dashboard
Displays key metrics:
- **Total Users**: All users in system
- **Active Users**: Users without `archivedAt`
- **Archived Users**: Users with `archivedAt` set
- **Administrators**: Count of ADMIN and SUPER_ADMIN users

## Technical Implementation

### Database Schema
Added `archivedAt` field to User model:
```prisma
model User {
  // ... existing fields ...
  archivedAt DateTime? // Tracks when user was archived
}
```

### Server Actions
Location: `/lib/actions/user-management-actions.ts`

1. **getAllUsersForManagement(searchTerm?, page, pageSize)**
   - Returns paginated list of users with all fields
   - Authorization: ADMIN, SUPER_ADMIN only

2. **updateUserRole(userId, newRole)**
   - Updates user role in database and Clerk
   - Authorization: ADMIN, SUPER_ADMIN only

3. **archiveUser(userId)**
   - Sets `archivedAt` timestamp
   - Updates Clerk metadata
   - Prevents self-archival
   - Authorization: ADMIN, SUPER_ADMIN only

4. **unarchiveUser(userId)**
   - Clears `archivedAt` timestamp
   - Removes Clerk archived flag
   - Authorization: SUPER_ADMIN only

### Middleware Protection
Location: `/proxy.ts`

The proxy middleware checks for archived users on every protected route:
```typescript
const publicMetadata = sessionClaims?.metadata as { archived?: boolean } | undefined
if (publicMetadata?.archived === true) {
  // Redirect to sign-in with archived parameter
  const signOutUrl = new URL('/sign-in', request.url)
  signOutUrl.searchParams.set('archived', 'true')
  return NextResponse.redirect(signOutUrl)
}
```

### Components

#### UserManagementTable
Path: `/components/admin/user-management-table.tsx`
- Renders table with all user data
- Inline role selector
- Archive/Unarchive buttons based on role
- Grays out archived users
- Disables controls for archived users

#### UserManagementPage
Path: `/app/(admin)/dashboard/users/page.tsx`
- Access control check on mount
- Search with Enter key support
- Statistics cards
- Pagination controls
- Loading states

## User Workflows

### Update User Role
1. Admin navigates to `/dashboard/users`
2. Locates user in table
3. Clicks role dropdown
4. Selects new role
5. System updates database and Clerk
6. Success toast displayed
7. Table refreshed with updated role

### Archive User
1. Admin navigates to `/dashboard/users`
2. Locates user in table
3. Clicks "Archive" button
4. Confirms in dialog
5. System sets `archivedAt` and updates Clerk metadata
6. User appears grayed out with "ARCHIVED" badge
7. User cannot log in

### Unarchive User (SUPER_ADMIN only)
1. Super Admin navigates to `/dashboard/users`
2. Locates archived user (grayed out row)
3. Clicks "Unarchive" button
4. System clears `archivedAt` and Clerk metadata
5. User regains login access
6. User appears normal with "ACTIVE" badge

### Search Users
1. Admin enters search term
2. Presses Enter or clicks "Search"
3. Table updates with filtered results
4. Pagination resets to page 1
5. Click "Clear" to reset

## Security Considerations

1. **Role-Based Access**: All server actions verify user role
2. **Self-Archive Prevention**: Users cannot archive themselves
3. **Audit Trail**: `archivedAt` timestamp provides history
4. **Clerk Integration**: Changes synced to Clerk metadata
5. **Middleware Protection**: Archived users blocked at proxy level
6. **No Hard Deletes**: Preserves data integrity

## Files Created/Modified

### New Files
- `/lib/actions/user-management-actions.ts` - Server actions
- `/components/admin/user-management-table.tsx` - Table component
- `/docs/user-management.md` - This documentation

### Modified Files
- `/app/(admin)/dashboard/users/page.tsx` - Main page
- `/prisma/schema.prisma` - Added `archivedAt` field
- `/proxy.ts` - Added archived user check

## Testing Checklist

- [ ] ADMIN can access `/dashboard/users`
- [ ] SUPER_ADMIN can access `/dashboard/users`
- [ ] GUARD redirected to `/`
- [ ] SUPERVISOR redirected to `/`
- [ ] Search by name works
- [ ] Search by email works
- [ ] Pagination works
- [ ] Role updates work
- [ ] Role changes sync to Clerk
- [ ] Archive works
- [ ] Cannot self-archive
- [ ] Archived users cannot log in
- [ ] Archived users appear grayed out
- [ ] Unarchive works (SUPER_ADMIN only)
- [ ] Statistics update correctly
- [ ] All user data displays properly
