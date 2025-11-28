# Prisma 7 Migration Issue & Resolution

## The Problem

**Error**: `"The column '(not available)' does not exist in the current database"`

**Root Cause**: The `archivedAt` column exists in `schema.prisma` but was never added to the Supabase database.

## Why We Couldn't Use `prisma db push`

### Prisma 7 Breaking Change ⚠️

Prisma 7.0.0 introduced a breaking change in how datasource URLs are configured:

**Before (Prisma 5/6)**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // ✅ Worked
}
```

**After (Prisma 7)**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // ❌ ERROR!
}
```

**Error Message**:
```
The datasource property `url` is no longer supported in schema files.
Move connection URLs for Migrate to `prisma.config.ts` and pass either
`adapter` for a direct database connection or `accelerateUrl` for Accelerate
to the `PrismaClient` constructor.
```

### Why This Matters

- Your **application code** works fine (uses `lib/prisma.ts` with adapter pattern)
- **Prisma CLI tools** (`migrate`, `db push`, `studio`) need special configuration
- Prisma 7 separates **runtime** config (lib/prisma.ts) from **CLI** config (prisma.config.ts)

## Current Setup

### ✅ Runtime (Application Code)

**File**: `lib/prisma.ts`

```typescript
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })
```

**Status**: ✅ Works perfectly - app connects to Supabase

### ⚠️ CLI Tools (Migrations)

**Problem**: Prisma 7 CLI commands can't find DATABASE_URL

**Attempted Solutions**:
1. ❌ Add `url` to schema.prisma - Not supported in Prisma 7
2. ⚠️ Create `prisma.config.ts` - Created but not recognized by CLI yet
3. ✅ Pass `--url` flag manually - Works but tedious
4. ✅ Run SQL directly in Supabase - **Current solution**

## The Solution

### Quick Fix: Run SQL in Supabase

1. Go to https://supabase.com/dashboard/project/qnhcymavgkchvymkkktr/sql
2. Run this SQL:

```sql
-- Add archivedAt column to User table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'User'
        AND column_name = 'archivedAt'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "archivedAt" TIMESTAMP(3);
    END IF;
END $$;
```

3. Verify in Prisma Studio:
```bash
npx prisma studio --url "postgresql://postgres.qnhcymavgkchvymkkktr:afzVUTcB*y9@C29@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

4. Refresh your app - sync error should be gone!

### Long-term: Use Supabase for Schema Changes

Since Prisma 7 CLI migrations are problematic with the adapter pattern:

**Recommended Workflow**:
1. Make schema changes in `prisma/schema.prisma`
2. Generate SQL from schema (manual or use migration dry-run)
3. Run SQL in Supabase SQL Editor
4. Run `npx prisma generate` to update Prisma Client
5. Test in Prisma Studio

**Alternative**: Wait for Prisma to improve prisma.config.ts support in future versions

## What We Learned

### Prisma 7 Architecture

**Two Separate Configurations**:

1. **Runtime Config** (lib/prisma.ts):
   - Used by your Next.js application
   - Supports PostgreSQL adapter pattern
   - Works with connection pooling (Supabase pooler)
   - ✅ Working perfectly

2. **CLI Config** (prisma.config.ts):
   - Used by `prisma migrate`, `prisma db push`, etc.
   - Still being refined in Prisma 7
   - Documentation unclear/incomplete
   - ⚠️ Not fully working yet

### Why We Use Adapter Pattern

**Standard Prisma** (without adapter):
```typescript
const prisma = new PrismaClient()  // Uses Prisma's built-in driver
```

**With Adapter** (our setup):
```typescript
const adapter = new PrismaPg(pool)  // Uses native pg driver
const prisma = new PrismaClient({ adapter })
```

**Benefits**:
- ✅ Native PostgreSQL driver performance
- ✅ Better connection pooling with Supabase
- ✅ Compatible with Supabase's pgbouncer
- ⚠️ Requires manual CLI configuration

## Files Created/Modified

### Created:
- `prisma/prisma.config.ts` - Attempted CLI configuration (not working yet)
- `docs/setup-verification.md` - Comprehensive setup documentation
- `docs/mcp-servers-setup.md` - MCP servers configuration
- `docs/prisma-7-migration-issue.md` - This file

### Modified:
- `prisma/schema.prisma` - Kept WITHOUT url property (correct for Prisma 7)
- `.claude/mcp.json` - Added Prisma and Supabase MCP servers

## Next Steps

1. ✅ **Immediate**: Run SQL in Supabase to add `archivedAt` column
2. ✅ **Verify**: Check Prisma Studio to confirm column exists
3. ✅ **Test**: Navigate to `/dashboard/users` - should work without errors
4. 📚 **Future**: Monitor Prisma 7 updates for better CLI config support

## References

- [Prisma 7 Client Configuration](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections)
- [Prisma PostgreSQL Adapter](https://www.prisma.io/docs/orm/overview/databases/postgresql#postgresqljs-adapter)
- [Supabase + Prisma Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#prisma)

## Summary

**The Issue**: Prisma 7 changed how CLI tools find database URLs

**The Workaround**: Run schema changes directly in Supabase SQL Editor

**The Lesson**: When using Prisma adapter pattern with Supabase, manual SQL migrations are currently the most reliable approach until Prisma 7 matures its CLI configuration.
