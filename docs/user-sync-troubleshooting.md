# User Sync Troubleshooting Guide

This guide helps troubleshoot issues where users can log into Clerk but aren't synced with the database.

## How User Sync Works

The application uses a **dual-sync approach**:

1. **Server-side sync (Primary)**: When a user accesses any authenticated page, `getCurrentUserWithSync()` automatically syncs them if they don't exist in the database
2. **Client-side sync (Backup)**: The `UserSyncProvider` component also attempts to sync users in the background

## Common Issues

### Issue 1: User Can't Access App After Login

**Symptoms:**
- User successfully logs into Clerk
- Gets redirected to sign-in or shows an error
- Logs show "User not found in database"

**Solution:**
1. Check server logs for sync errors (look for `[PROD][SYNC]` or `[DEV][SYNC]` messages)
2. Manually trigger sync by visiting: `https://your-domain.com/api/sync-user`
3. Check database connection is working
4. Verify the user's email in both Clerk and database

### Issue 2: Production vs Local Sync Differences

**Symptoms:**
- Works locally but not in production
- Different Clerk IDs between environments

**Root Cause:**
Each Clerk environment (development vs production) has different user IDs. A user with the same email will have:
- Different Clerk ID in development
- Different Clerk ID in production

**Solution:**
The sync system handles this by:
1. First checking for user by Clerk ID
2. If not found, checking by email
3. Updating the Clerk ID if found by email
4. Creating a new user if not found

This means:
- ✅ Local seed data users will be updated with production Clerk IDs automatically
- ✅ Users can use the same email across environments
- ✅ No manual intervention needed

## Manual Sync Endpoint

### Usage

**URL:** `/api/sync-user`

**Method:** GET

**Authentication:** User must be logged into Clerk

**Example:**
```bash
# In browser (while logged in)
https://your-domain.com/api/sync-user

# Or with curl
curl https://your-domain.com/api/sync-user \
  -H "Cookie: __session=YOUR_CLERK_SESSION"
```

**Success Response:**
```json
{
  "success": true,
  "message": "User synced successfully",
  "user": {
    "id": "cm6abc123...",
    "email": "user@example.com",
    "role": "GUARD",
    "clerkId": "user_2abc123..."
  },
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Not authenticated with Clerk",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

## Debugging Steps

### 1. Check Clerk Authentication

```bash
# Verify user is logged into Clerk
# In browser console:
console.log(await Clerk.session)
```

### 2. Check Database Connection

```bash
# On server
npx prisma db pull
```

### 3. Check Sync Logs

Look for these log patterns:

**Successful Sync:**
```
[PROD][GET_USER_SYNC] Clerk user ID: user_2abc123...
[PROD][GET_USER_SYNC] ⚠️  User not in database, triggering sync...
[PROD][SYNC] Starting sync for: user@example.com (Clerk ID: user_2abc123...)
[PROD][SYNC] ✅ Found existing user by email, updating clerkId
[PROD][SYNC] ✅ User updated: {...}
[PROD][GET_USER_SYNC] ✅ User synced successfully: {...}
```

**Failed Sync:**
```
[PROD][GET_USER_SYNC] Clerk user ID: user_2abc123...
[PROD][GET_USER_SYNC] ⚠️  User not in database, triggering sync...
[PROD][SYNC] ❌ Error syncing user: [error message]
[PROD][GET_USER_SYNC] ❌ Failed to sync user: [error message]
```

### 4. Check User in Database

```bash
# Using Prisma Studio
npx prisma studio

# Or SQL
SELECT id, email, "clerkId", role, "createdAt"
FROM "User"
WHERE email = 'user@example.com';
```

### 5. Manual Database Fix

If sync fails, you can manually update the user:

```sql
-- Update existing user with new Clerk ID
UPDATE "User"
SET "clerkId" = 'user_2abc123...'
WHERE email = 'user@example.com';
```

## Deployment Checklist

When deploying to production:

- [ ] Verify `DATABASE_URL` environment variable is set
- [ ] Verify Clerk production keys are configured:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
- [ ] Test login with at least one user
- [ ] Check logs for sync success
- [ ] Verify user appears in database with correct Clerk ID

## Environment-Specific Logs

The sync system automatically prefixes logs with `[PROD]` or `[DEV]` to help distinguish between environments:

- `[DEV]` - Local development (NODE_ENV !== 'production')
- `[PROD]` - Production environment (NODE_ENV === 'production')

## Code References

Key files:
- [lib/auth/sync-user.ts](../lib/auth/sync-user.ts) - Sync logic
- [app/api/sync-user/route.ts](../app/api/sync-user/route.ts) - Manual sync endpoint
- [app/(public)/layout.tsx](../app/(public)/layout.tsx) - Public layout with auto-sync
- [app/(admin)/dashboard/layout.tsx](../app/(admin)/dashboard/layout.tsx) - Admin layout with auto-sync
- [components/auth/user-sync-provider.tsx](../components/auth/user-sync-provider.tsx) - Client-side sync (backup)

## Getting Help

If issues persist:
1. Check application logs for detailed error messages
2. Verify database connectivity
3. Check Clerk dashboard for user status
4. Use the manual sync endpoint to get detailed error information
