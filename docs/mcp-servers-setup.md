# MCP Servers Setup Guide

## What are MCP Servers?

Model Context Protocol (MCP) servers allow AI assistants like Claude Code to directly interact with your development tools (Prisma, Supabase, GitHub, etc.) to diagnose issues, run commands, and manage your infrastructure.

## Installed MCP Servers

Your project now has the following MCP servers configured in `.claude/mcp.json`:

1. **Prisma MCP** - Database schema and migration management
2. **Supabase MCP** - Supabase project and database management
3. **GitHub MCP** - GitHub repository operations
4. **Next DevTools MCP** - Next.js debugging and development
5. **Vercel MCP** - Vercel deployment and management

## Setup Instructions

### 1. Prisma MCP Server ✅

**Status**: Already configured!

The Prisma MCP server is built into Prisma CLI (v6.6.0+) and requires no additional setup.

**Capabilities**:
- Run database migrations (`migrate-dev`, `migrate-status`)
- Manage database schema
- Create and provision databases
- Diagnose migration issues

**No environment variables needed** - Uses your existing `DATABASE_URL` from `.env`

### 2. Supabase MCP Server ⚙️

**Status**: Needs environment variables

Add these to your `.env` file:

```bash
# Supabase MCP Server
SUPABASE_ACCESS_TOKEN=your_access_token_here
SUPABASE_PROJECT_ID=qnhcymavgkchvymkkktr
```

**How to get SUPABASE_ACCESS_TOKEN**:
1. Go to https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Name it "MCP Server - Dev"
4. Copy the token and add to `.env`

**Capabilities**:
- Create and manage Supabase projects
- Design tables and generate migrations
- Query data and run SQL reports
- Manage branches and configurations
- Retrieve logs for debugging

**⚠️ Security**: Only use with development/staging data, NOT production!

### 3. GitHub MCP Server ✅

**Status**: Already configured

Uses `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable (should already be set).

### 4. Next DevTools MCP ✅

**Status**: Ready to use

No configuration needed.

### 5. Vercel MCP ⚙️

**Status**: Needs environment variable

Add to `.env`:
```bash
VERCEL_API_TOKEN=your_vercel_token_here
```

## Using MCP Servers in Claude Code

Once configured, you can ask Claude Code to:

**Prisma MCP Examples**:
- "Run a Prisma migration to add the archivedAt column"
- "Check the status of my database migrations"
- "Generate a Prisma migration for the schema changes"

**Supabase MCP Examples**:
- "Show me the current schema of my User table in Supabase"
- "Check if the archivedAt column exists in the database"
- "Query all users with SUPER_ADMIN role from Supabase"

## Benefits for Your Current Issue

The Prisma and Supabase MCP servers will help us:

1. ✅ **Verify database schema** - Check if `archivedAt` column exists
2. ✅ **Run migrations safely** - Execute `prisma db push` through MCP
3. ✅ **Diagnose connection issues** - Test DATABASE_URL connectivity
4. ✅ **Compare schema to database** - Ensure they're in sync
5. ✅ **Check Supabase configuration** - Verify pooler vs direct connection

## Restart Required

After adding the environment variables to `.env`, **restart Claude Code** to activate the MCP servers.

## Testing MCP Servers

To verify they're working, ask Claude Code:

```
"Use the Prisma MCP server to check my migration status"
```

Or:

```
"Use the Supabase MCP server to show my User table schema"
```

## Sources

- [Prisma MCP Server Documentation](https://www.prisma.io/docs/postgres/integrations/mcp-server)
- [About MCP Servers & How We Built One for Prisma](https://www.prisma.io/blog/about-mcp-servers-and-how-we-built-one-for-prisma)
- [Supabase MCP Documentation](https://supabase.com/docs/guides/getting-started/mcp)
- [Supabase MCP GitHub Repository](https://github.com/supabase-community/supabase-mcp)
