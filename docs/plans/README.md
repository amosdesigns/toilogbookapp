# MVP Feature Plans

This directory contains detailed implementation plans for the remaining MVP features of the Town of Islip Marina Guard Logbook application.

## Overview

These plans were created through comprehensive exploration of the existing codebase and detailed requirements gathering. Each plan includes database schema changes, server actions, UI components, and implementation phases.

## Feature Plans

### 1. Timesheets Management
**File**: `01-timesheets-management.md`

**Purpose**: Weekly timesheet system for supervisor approval and payroll processing

**Key Features**:
- On-demand weekly timesheet generation from duty sessions
- Supervisor can adjust hours with audit trail
- Single-step approval workflow
- PDF export for payroll
- Bulk approval operations

**Estimated Effort**: 15-20 hours
**Status**: Planned, not implemented

---

### 2. Admin Logbook Management
**File**: `02-logbook-management.md`

**Purpose**: Comprehensive log management with incident reporting workflow

**Key Features**:
- View/filter all logs across locations
- Full edit capability with audit trail
- Formal incident report creation from logs
- Multi-step approval workflow (Guard → Supervisor → Admin → Authorities)
- PDF export for incident reports
- Photo/video gallery support
- Bulk operations

**Estimated Effort**: 13-17 hours
**Status**: Planned, not implemented

---

### 3. Admin Settings Page
**File**: `03-admin-settings-page.md`

**Purpose**: Admin UI to manage safety checklist items and locations

**Key Features**:
- **Safety Checklist Management**: CRUD for guard check-in questions
- **Location Settings**: Manage marina locations and max guard capacity
- Enable default checklist templates (10 pre-defined items)
- Tabbed interface for clean organization
- **NO database changes needed** - all schema exists!

**Estimated Effort**: 6-9 hours
**Status**: Planned, not implemented

---

## Implementation Priority

Recommended implementation order:

1. **Admin Settings** (6-9 hours) - No schema changes, enables better testing
2. **Logbook Management** (13-17 hours) - Critical for supervisor workflow
3. **Timesheets Management** (15-20 hours) - Important but can use manual process temporarily

**Total Estimated Effort**: 34-46 hours

## Design Principles

All plans follow the established codebase patterns:

- ✅ **NO `any` types** - Strict TypeScript typing
- ✅ **Server Actions ONLY** - No API routes
- ✅ **Result<T> pattern** - Consistent error handling
- ✅ **Zod validation** - All inputs validated
- ✅ **Role-based access** - Proper permission checks
- ✅ **Soft deletes** - Data preservation with `archivedAt`
- ✅ **Audit trails** - Track all modifications

## Database Changes Summary

### Required Migrations

**Timesheets Feature**:
- Timesheet (aggregate weekly data)
- TimesheetEntry (individual sessions)
- TimesheetAdjustment (audit trail)

**Logbook Feature**:
- IncidentReport (formal reports)
- LogEdit (audit trail)

**Settings Feature**:
- **NONE** - All schema already exists!

### Migration Strategy

To minimize disruption, consider implementing all database changes in a single migration before starting UI work:

```bash
# Suggested approach
1. Add all new models to schema.prisma
2. Run single migration: npx prisma migrate dev --name add_mvp_features
3. Update seed file to include example data
4. Implement UI features one at a time
```

## Testing Strategy

For each feature:
1. Unit tests for server actions
2. Permission testing (try as different roles)
3. Workflow testing (end-to-end)
4. Edge case handling
5. Mobile responsive design check

## Notes

- All plans reference the current codebase state as of November 2025
- Plans assume Next.js 16, Prisma 7, PostgreSQL stack
- PDF generation uses `@react-pdf/renderer` (install when needed)
- Plans are living documents - update as implementation proceeds

## Questions or Clarifications

If any requirements are unclear during implementation:
1. Check CLAUDE.md for architectural guidance
2. Review existing similar features in the codebase
3. Consult with stakeholders before making assumptions
