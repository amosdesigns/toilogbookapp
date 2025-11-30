# Timesheets Management Feature Implementation Plan

## Overview

Implement a comprehensive timesheets management system for supervisors to review, adjust, approve, and export weekly timesheets for guards and other staff.

## Requirements Summary

- **Weekly timesheets**: 7-day periods (Sunday-Saturday)
- **Supervisor adjustments**: Can edit hours/times with required notes for audit trail
- **Single approval workflow**: Supervisor approves/rejects in one step
- **Print/PDF export**: Generate printable timesheet reports
- **Bulk approval**: Approve multiple timesheets at once
- **Access**: SUPERVISOR role and higher only

## Database Schema Changes

### New Models Required

**Timesheet** - Aggregate weekly timesheet per user
```prisma
model Timesheet {
  id              String          @id @default(cuid())
  userId          String
  weekStartDate   DateTime        // Sunday 00:00
  weekEndDate     DateTime        // Saturday 23:59
  totalHours      Decimal         @db.Decimal(6, 2)
  totalEntries    Int
  status          TimesheetStatus @default(DRAFT)
  // ... approval workflow fields
}
```

**TimesheetEntry** - Individual duty sessions
```prisma
model TimesheetEntry {
  id              String      @id @default(cuid())
  timesheetId     String
  dutySessionId   String?
  clockInTime     DateTime
  clockOutTime    DateTime
  hoursWorked     Decimal     @db.Decimal(5, 2)
  originalClockIn DateTime?   // For audit trail
  wasAdjusted     Boolean     @default(false)
}
```

**TimesheetAdjustment** - Audit trail for modifications
```prisma
model TimesheetAdjustment {
  id              String          @id @default(cuid())
  timesheetId     String
  adjustedBy      String
  reason          String          @db.Text
  // ... change tracking
}
```

## Implementation Phases

1. **Database & Utilities** - Schema, migrations, helper functions
2. **Server Actions** - 12 server actions for CRUD and workflow
3. **Page Structure** - Server and client components
4. **Core Components** - Tables, dialogs, forms (9 components)
5. **PDF Export** - React-PDF template and generation
6. **Bulk Operations** - Bulk approval with progress tracking

## Key Features

- On-demand timesheet generation from duty sessions
- Supervisor can adjust hours with required explanations
- Denormalized hours for performance
- Full audit trail of all changes
- State machine workflow: DRAFT → PENDING → APPROVED/REJECTED
- PDF export for payroll processing
- Bulk approval of multiple timesheets

## Critical Files

- **New**: ~15-20 files including actions, components, PDF templates
- **Estimated Time**: 15-20 hours
- **Total LOC**: ~2000-2500 lines

See `/Users/jeromeamos/.claude/plans/immutable-petting-simon.md` for full implementation details.
