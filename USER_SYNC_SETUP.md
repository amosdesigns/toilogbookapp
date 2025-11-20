# Automatic User Sync - Clerk to Database

## How It Works

This app uses **Clerk ONLY for authentication** (sign in/sign out). Your **database is the single source of truth** for all user data.

### Architecture

```
User Signs In with Clerk
        ↓
UserSyncProvider (automatic)
        ↓
Checks if user exists in database
        ↓
If NO: Creates new user with role "GUARD"
If YES: Updates basic info (email, name)
        ↓
Database is now synced ✅
```

## What Gets Synced

### From Clerk → Database (Auto-sync)
- ✅ Email address
- ✅ First name
- ✅ Last name

### Managed ONLY in Database (Never synced from Clerk)
- ✅ **Role** (GUARD, SUPERVISOR, ADMIN, SUPER_ADMIN)
- ✅ All other user data

## How to Change User Roles

Since roles are managed in the database, you change them there:

### Option 1: Using Prisma Studio
```bash
npx prisma studio
```
1. Go to http://localhost:5555
2. Click on "User" table
3. Find the user
4. Change their "role" field
5. Save

### Option 2: Using SQL (Supabase Dashboard)
```sql
-- Make user a SUPERVISOR
UPDATE "User"
SET role = 'SUPERVISOR'
WHERE email = 'user@example.com';

-- Make user an ADMIN
UPDATE "User"
SET role = 'ADMIN'
WHERE email = 'user@example.com';

-- Make user a SUPER_ADMIN
UPDATE "User"
SET role = 'SUPER_ADMIN'
WHERE email = 'user@example.com';
```

## First Time Setup

1. **Setup Database Tables**
   - Run the SQL in `supabase-setup.sql` in Supabase SQL Editor
   - This creates all tables including User table

2. **Sign In with Clerk**
   - Just sign in normally
   - The system will automatically create your user record

3. **Check Your Role**
   - New users default to "GUARD" role
   - Change it in the database if needed

## Troubleshooting

### "User not found" error
If you see this error:
1. Make sure database tables are created (run `supabase-setup.sql`)
2. Sign out and sign back in (triggers the sync)
3. Check browser console for sync logs: `[USER_SYNC]`

### User not syncing
1. Check browser console for errors
2. Make sure database is accessible
3. Verify `DATABASE_URL` in `.env` is correct

## Files Modified

- ✅ `lib/auth/sync-user.ts` - Core sync logic
- ✅ `components/auth/user-sync-provider.tsx` - Auto-sync component
- ✅ `app/layout.tsx` - Added UserSyncProvider wrapper

## Benefits of This Approach

1. ✅ **Simple**: Clerk only does authentication
2. ✅ **Flexible**: All user data in your control
3. ✅ **No webhooks**: No need for complex webhook setup
4. ✅ **Automatic**: Users created on first sign-in
5. ✅ **Database first**: Your database is the source of truth

## Managing Users

### To add a new user:
Just give them the Clerk sign-in link. They'll be auto-created as GUARD.

### To promote a user:
Update their role in the database (see "How to Change User Roles" above).

### To remove a user:
1. Delete from Clerk (they can't sign in anymore)
2. Optionally delete from database (or keep for historical records)
