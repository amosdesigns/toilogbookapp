# Admin Logbook Management Page Implementation Plan

## Overview

Implement a comprehensive logbook management page for supervisors and admins to view, filter, edit, and manage all logs across all locations. Includes full incident report workflow with multi-step approval, PDF export, and notifications.

## Requirements Summary

- **Dual purpose**: Both log viewing/filtering AND incident report workflow
- **Supervisor edit capability**: Full edit access to logs created by guards
- **Incident workflow**: Multi-step approval, Draft/Final states, PDF export, Notification alerts
- **Filtering**: Location, Date range, Log type, Severity/Status filters
- **Access**: SUPERVISOR role and higher only

## Current System Analysis

### What Already Exists

**Log Model** - Comprehensive logging system
- Types: INCIDENT, PATROL, VISITOR_CHECKIN, MAINTENANCE, WEATHER, ON_DUTY_CHECKLIST, OTHER
- Incident fields: severity, incidentTime, peopleInvolved, witnesses, actionsTaken
- Review workflow: reviewedBy, reviewedAt, reviewNotes
- Media support: photoUrls, videoUrls (JSON arrays)

**Server Actions** - Already implemented
- `getLogs()` with advanced filtering
- `createLog()`, `updateLog()`, `deleteLog()`
- `reviewIncident()` for supervisor review

### What's Missing

**New Database Model**: IncidentReport
- Formal incident reports for authorities (separate from casual logs)
- Multi-step approval workflow
- Report numbering (IR-YYYY-MM-NNNN)
- Authority submission tracking

**UI Components**:
- Comprehensive logs data table
- Advanced filters panel
- Log detail/edit dialogs
- Incident report workflow dialogs (7 dialogs)
- Photo/video gallery
- Bulk operations

## Database Schema Changes

### New Models Required

**IncidentReport** - Formal reports for authorities
```prisma
model IncidentReport {
  id                  String                @id @default(cuid())
  logId               String                @unique
  reportNumber        String                @unique  // IR-YYYY-MM-NNNN
  status              IncidentReportStatus  @default(DRAFT)

  // Multi-step approval
  submittedBy         String?
  reviewedBy          String?
  approvedBy          String?
  authoritySubmittedBy String?

  // Authority tracking
  authorityName       String?
  authorityRefNumber  String?
  // ... additional fields
}
```

**LogEdit** - Audit trail for log edits
```prisma
model LogEdit {
  id          String   @id @default(cuid())
  logId       String
  editedBy    String
  fieldChanged String
  oldValue    String?  @db.Text
  newValue    String?  @db.Text
  reason      String?  @db.Text
}
```

## Incident Report Workflow

```
DRAFT → UNDER_REVIEW → SUPERVISOR_APPROVED → APPROVED → SUBMITTED → CLOSED
```

## Implementation Phases

1. **Database & Actions** - IncidentReport model, LogEdit, server actions
2. **Page Structure** - Server component with auth checks
3. **Core Log Components** - Table, filters, dialogs (7 components)
4. **Incident Report Components** - Workflow dialogs (7 components)
5. **PDF Export** - Incident report and log export templates
6. **Integration** - Notifications, audit trail, testing

## Key Features

- View/filter all logs with advanced filters
- Edit any log (with audit trail)
- Create formal incident reports from logs
- Multi-step approval workflow
- PDF export for authorities
- Bulk operations (archive, export)
- Photo/video gallery viewer
- Follow-up tracking

## Critical Files

- **New**: ~24 files including actions, components, PDF templates
- **Modified**: 2 files (log-form.tsx, logs.ts)
- **Estimated Time**: 13-17 hours
- **Total LOC**: ~2500-3000 lines

See `/Users/jeromeamos/.claude/plans/immutable-petting-simon.md` for full implementation details.
