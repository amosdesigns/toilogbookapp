# Incident Report Implementation Summary

## Updated Requirements (from User Clarifications)

### 1. **Permissions**
- **ONLY supervisors or higher can start/create incident reports**
  - Guards CANNOT start reports
  - Supervisors can create reports for any log at their locations
  - Admins and Super Admins can create reports for any log

### 2. **Workflow**
1. **Supervisor creates report** from a log detail view
2. **Data is stored in database** (editable until signed)
3. **Assignees sign when ready** (auto-dated signatures)
4. **Print report** as PDF (print-ready format)

### 3. **Notifications**
- **Who gets notified**: Other supervisors (not all users, just supervisors)
- Notifications sent when report is created
- Supervisor can select which supervisors to notify

### 4. **Incident Number Generation**
- Based on log ID (not random)
- Format: `INC-YYYY-{logId}` or similar deterministic pattern

### 5. **Storage & Output**
- **Store in database**: Full report data in `IncidentReportGeneration` table
- **Locked immediately**: Report is locked upon creation (no editing after creation)
- **PDF generation**: Generate PDF on-demand each time (no storage)
- **One report per log**: Only one incident report can be created per log

### 6. **PDF Format**
- **Logo**: TOI logo (`toilogo.png`) centered at top
- **Professional format**: Matches Town of Islip official incident report format
- **Signatures**: Shows digital signatures with timestamps if signed
- **Physical signature lines**: Included for filing purposes

## Database Schema

### IncidentReportGeneration Model

```prisma
model IncidentReportGeneration {
  id             String   @id @default(cuid())
  logId          String
  log            Log      @relation(fields: [logId], references: [id], onDelete: Cascade)

  // Report metadata
  incidentNumber String   @unique  // Format: INC-YYYY-{logId}
  generatedAt    DateTime @default(now())
  generatedBy    String   // User ID who generated (must be supervisor+)

  // Report is editable until signed
  isLocked       Boolean  @default(false)

  // Guard signature (can be assigned and signed later)
  guardAssignedId   String?  // User ID assigned to sign as guard
  guardSignedBy     String?  // User ID who actually signed
  guardSignedByName String?  // Full name
  guardSignedAt     DateTime?  // Auto-dated when they sign
  guardIpAddress    String?

  // Supervisor signature (can be assigned and signed later)
  supervisorAssignedId   String?  // User ID assigned to sign as supervisor
  supervisorSignedBy     String?  // User ID who actually signed
  supervisorSignedByName String?  // Full name
  supervisorSignedAt     DateTime?  // Auto-dated when they sign
  supervisorIpAddress    String?

  // PDF storage (optional - can regenerate from data)
  pdfUrl      String?
  pdfStoredAt DateTime?

  // Notification tracking (array of supervisor user IDs)
  notifiedUsers String[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([logId])
  @@index([incidentNumber])
  @@index([generatedBy])
  @@index([guardAssignedId])
  @@index([supervisorAssignedId])
}
```

## User Flow

### Creating a Report (Supervisor Only)

```
1. Supervisor opens log detail (any log type)
2. Clicks "Generate Incident Report" button
   → Button only visible to supervisors+
3. Form dialog opens with data pre-populated from log:
   - Incident number: Auto-generated from log ID
   - Report date: Today's date
   - Incident date: From log.incidentTime or log.createdAt
   - Location: From log.location
   - Guard on duty: From log.user or assignable
   - Supervisor on duty: Current user or assignable
   - Incident description: From log.description
   - Actions taken: From log.actionsTaken
   - Follow up: From log.followUpNotes
4. Supervisor can:
   - Edit any field
   - Assign guard signature (select user)
   - Assign supervisor signature (select user)
   - Select supervisors to notify (multi-select)
5. Clicks "Create Report"
   → Report saved to database (editable state, isLocked=false)
   → Notifications sent to selected supervisors
   → PDF can be generated/printed immediately
```

### Signing a Report (Assignee)

```
1. Assignee (guard or supervisor) opens report
2. Sees "Sign Report" button if they are assigned
3. Clicks "Sign Report"
   → Signature dialog opens with preview:
     "By signing, you confirm that..."
     Your signature: [Name]
     Date: [Auto-filled with current date/time]
4. Clicks "Sign"
   → Signature recorded with timestamp (auto-dated)
   → If both signatures present, report becomes locked
   → PDF regenerates with signatures
```

### Printing a Report

```
1. User opens report
2. Clicks "Print Report" or "Download PDF"
3. PDF generates with:
   - All report fields
   - Digital signatures (if signed)
   - Physical signature lines (for filing)
4. PDF opens in new tab or downloads
5. User can print from browser
```

## Components to Build

### 1. Generate Incident Report Dialog
**File**: `components/logs/generate-incident-report-dialog.tsx`

- Form with all incident report fields
- Pre-populate from log data
- Guard assignment (select user)
- Supervisor assignment (select user)
- Supervisor notification selector (multi-select)
- Validation with Zod
- Create report server action call

### 2. Sign Report Dialog
**File**: `components/incident-reports/sign-report-dialog.tsx`

- Shows report preview
- Confirmation message
- Auto-fills name and current date/time
- Records signature with timestamp
- Locks report if both signatures present

### 3. Incident Report View Dialog
**File**: `components/incident-reports/incident-report-view-dialog.tsx`

- Displays full report
- Shows signature status
- "Sign Report" button (if assignee)
- "Print Report" / "Download PDF" button
- "Edit Report" button (if not locked and has permission)

### 4. Supervisor Multi-Select
**File**: `components/incident-reports/supervisor-selector.tsx`

- Multi-select dropdown
- Fetches supervisors from server action
- Shows name, role, location
- Returns array of user IDs

### 5. PDF Generator Utility
**File**: `lib/utils/incident-report-pdf.ts`

- Uses jsPDF
- Matches official Town of Islip format
- Includes digital signatures (if present)
- Includes physical signature lines
- Professional formatting

## Server Actions

### 1. Create Incident Report
**File**: `lib/actions/incident-report-actions.ts`

```typescript
export async function createIncidentReport(
  logId: string,
  data: IncidentReportFormData
): Promise<Result<IncidentReportGeneration>>
```

- Verify user is supervisor+
- Fetch log data
- Generate incident number from log ID
- Create IncidentReportGeneration record
- Send notifications to selected supervisors
- Return created report

### 2. Sign Report
**File**: `lib/actions/incident-report-actions.ts`

```typescript
export async function signIncidentReport(
  reportId: string,
  signatureType: "GUARD" | "SUPERVISOR"
): Promise<Result<IncidentReportGeneration>>
```

- Verify user is assigned to sign
- Verify report is not locked
- Record signature with auto-dated timestamp
- Get user's name and IP
- If both signatures present, lock report
- Return updated report

### 3. Get Supervisors for Notification
**File**: `lib/actions/incident-report-actions.ts`

```typescript
export async function getSupervisorsForNotification(): Promise<
  Result<Array<{ id: string; name: string; role: string }>>
>
```

- Fetch all active supervisors
- Return simplified user objects for selection

### 4. Generate PDF
**File**: `lib/actions/incident-report-actions.ts`

```typescript
export async function generateIncidentReportPDF(
  reportId: string
): Promise<Result<Blob>>
```

- Fetch report with all data
- Generate PDF using jsPDF
- Return as blob for download/print

## Next Steps

1. ✅ Create database schema
2. ✅ Add server actions (basic structure)
3. ⬜ Create validation schemas
4. ⬜ Build Generate Report dialog
5. ⬜ Build Sign Report dialog
6. ⬜ Build PDF generator
7. ⬜ Add "Generate Report" button to log detail
8. ⬜ Test workflow end-to-end

## Key Technical Points

- **No Guards Creating Reports**: Enforce in server actions and UI
- **Incident Number from Log ID**: Deterministic, not random
- **Auto-Dated Signatures**: Timestamp captured when user signs
- **Editable Until Locked**: Once both signatures present, no more edits
- **Supervisor-Only Notifications**: Only supervisors in notification list
- **Print-Ready PDF**: Can be generated anytime from database data
