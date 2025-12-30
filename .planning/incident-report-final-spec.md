# Incident Report - Final Specification

## Requirements Summary

### Access Control
- **ONLY supervisors or higher** can create incident reports
- Guards **CANNOT** create reports
- Button only shows for supervisors, admins, and super admins

### When Button Shows
1. Log type is `INCIDENT`
2. User is supervisor or higher
3. No report has been generated yet for this log (check `logId` in `IncidentReportGeneration`)

### Report Creation
- Supervisor clicks "Generate Incident Report" button from log detail
- One report per log (enforced by unique constraint on `logId`)
- Report is locked immediately upon creation (no editing after creation)
- Incident number format: `INC-YYYY-{logId}` (deterministic, based on log ID)

### Signatures
- **Supervisor signature**: Required to be assigned (at creation)
- **Guard signature**: Optional, can be assigned
- Both can sign later when ready
- Signature auto-dated with current timestamp when signed
- Records signer's name and IP address

### Notifications
- Notify **other supervisors only** (not all users)
- Supervisor selects which supervisors to notify when creating report
- Notifications sent immediately upon report creation

### PDF Output
- TOI logo (`/public/images/toilogo.png`) centered at top
- Professional format matching Town of Islip official template
- Generated on-demand each time (no storage)
- Shows digital signatures with timestamps if signed
- Includes physical signature lines for filing

## Database Schema

```prisma
model IncidentReportGeneration {
  id             String   @id @default(cuid())
  logId          String   @unique  // One report per log
  log            Log      @relation(...)

  incidentNumber String   @unique  // INC-YYYY-{logId}
  generatedAt    DateTime @default(now())
  generatedBy    String   // Supervisor+ user ID

  // Guard signature (optional)
  guardAssignedId   String?
  guardSignedBy     String?
  guardSignedByName String?
  guardSignedAt     DateTime?  // Auto-dated
  guardIpAddress    String?

  // Supervisor signature (required)
  supervisorAssignedId   String   // Required
  supervisorSignedBy     String?
  supervisorSignedByName String?
  supervisorSignedAt     DateTime?  // Auto-dated
  supervisorIpAddress    String?

  // Notifications
  notifiedUsers String[]  // Supervisor user IDs

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Implementation Checklist

### Phase 1: Database & Server Actions
- [x] Create database schema
- [x] Create migration
- [ ] Update server actions file
  - [ ] `createIncidentReport(logId, formData)` - Create report
  - [ ] `signIncidentReport(reportId, type)` - Sign report
  - [ ] `getSupervisorsForNotification()` - Get supervisor list
  - [ ] `generateIncidentReportPDF(reportId)` - Generate PDF
  - [ ] `canGenerateReport(logId)` - Check if report can be generated

### Phase 2: UI Components
- [ ] Generate Incident Report Dialog
  - [ ] Form with all fields
  - [ ] Pre-populate from log data
  - [ ] Guard assignment dropdown
  - [ ] Supervisor assignment dropdown
  - [ ] Supervisor notification multi-select
  - [ ] Validation
- [ ] Supervisor Multi-Select Component
- [ ] Add button to Log Detail Card
  - [ ] Only show if log.type === 'INCIDENT'
  - [ ] Only show if user is supervisor+
  - [ ] Only show if no report exists for this log

### Phase 3: PDF Generation
- [ ] Install jsPDF library
- [ ] Create PDF generator utility
  - [ ] TOI logo at top (centered)
  - [ ] Official format layout
  - [ ] Digital signatures section
  - [ ] Physical signature lines
- [ ] Test PDF output

### Phase 4: Signing Workflow
- [ ] Sign Report Dialog
- [ ] Auto-date signature when signed
- [ ] Record IP address
- [ ] Update report in database

### Phase 5: Testing
- [ ] Test report creation (supervisor only)
- [ ] Test button visibility logic
- [ ] Test one-report-per-log constraint
- [ ] Test signature workflow
- [ ] Test PDF generation with logo
- [ ] Test notifications to supervisors

## Component File Structure

```
components/
  logs/
    log-detail-dialog.tsx          [MODIFY] - Add Generate Report button
  incident-reports/                [CREATE NEW FOLDER]
    generate-incident-report-dialog.tsx
    sign-report-dialog.tsx
    incident-report-view-dialog.tsx
    supervisor-multi-select.tsx

lib/
  actions/
    incident-report-actions.ts     [MODIFY] - Add all CRUD operations
  utils/
    incident-report-pdf.ts         [CREATE] - PDF generation with jsPDF
  validations/
    incident-report.ts             [EXISTS] - Already has schema
```

## Next Immediate Steps

1. Wait for migration to complete
2. Update `incident-report-actions.ts` with all server actions
3. Create Generate Incident Report dialog component
4. Add button to log detail card with proper visibility logic
5. Install jsPDF and create PDF generator
6. Test end-to-end workflow
