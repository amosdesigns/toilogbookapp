# Marina Incident Report Document - Requirements

## Overview
Generate a formal "Public Safety Enforcement Marina Incident Report" document from a log entry. This is a **printable/PDF document** that follows the official Town of Islip marina incident reporting format.

## Document Format

### Header Section
```
Incident # _____________ Time: _____________

Public Safety Enforcement Marina Incident Report

Report Date: [Date]
Location: [Marina Name]                    Incident Date: [Date]
Marina Guard on Duty: [Guard Name]         Supervisor on Duty: [Supervisor Name]
Who Was Notified: ______________________________
```

### Incident Section
```
Incident: (Briefly describe what happened)
[Multi-paragraph narrative description of the incident, including:
 - Date and time specifics
 - What was observed
 - Who was involved
 - What was said/done
 - Relevant context and details]
```

### Actions Taken Section
```
Actions Taken
[Multi-paragraph description of:
 - What the guard did in response
 - Who was contacted/notified
 - Instructions received
 - Steps taken to resolve or document]
```

### Follow Up Section
```
Follow Up
[Description of:
 - What follow-up actions occurred
 - Current status
 - Any outstanding items]
```

### Signature Section
```
Signature Marina Guard: ____________________________________________

Signature Supervisor: _______________________________________________
```

## Example Content Structure

Based on the provided example:

**Incident Section**:
- Opens with specific date and time ("On Sunday, August 2nd, at approximately 1:02 AM...")
- Describes what was observed/heard first
- Explains the guard's response
- Details the encounter (who, what, where)
- Includes relevant observations (alcohol smell, crude language, threats)
- Provides context (gate policies, individual's claims)

**Actions Taken Section**:
- Reports made to supervisor
- Previous context/communications
- Specific instructions received
- Actions taken based on instructions
- Additional reports made (e.g., deer sighting)

**Follow Up Section**:
- What the supervisor did
- Current understanding of resolution
- Any ongoing concerns

## Implementation Approach

### Option 1: PDF Generation (Recommended)
Generate a properly formatted PDF document that:
- Matches the official format exactly
- Can be printed or saved
- Includes signature lines
- Is paginated if content is long

### Option 2: Print-Optimized HTML
Generate HTML with print CSS that:
- Formats correctly when printed
- Hides navigation/UI elements when printing
- Maintains proper spacing and layout
- Includes page breaks where needed

### Option 3: Word Document Export
Generate a .docx file that:
- Can be edited if needed
- Maintains formatting
- Can be signed digitally or printed

## Data Mapping

### From Log Entry to Report Fields

| Report Field | Source | Notes |
|--------------|--------|-------|
| Incident # | Generated | Sequential number or use log ID |
| Time | `log.incidentTime` or `log.createdAt` | Format as "HH:MM AM/PM" |
| Report Date | `log.createdAt` | Date when guard created log |
| Location | `log.location.name` | Marina name |
| Incident Date | `log.incidentTime` or `log.createdAt` | Date incident occurred |
| Marina Guard on Duty | `log.user.firstName + lastName` | Guard who created log |
| Supervisor on Duty | `log.shift.supervisor.firstName + lastName` or manually entered | From assigned shift |
| Who Was Notified | `log.followUpNotes` or manual entry | People/agencies notified |
| Incident (description) | `log.description` | Main narrative |
| Actions Taken | `log.actionsTaken` | What guard did |
| Follow Up | `log.followUpNotes` | Follow-up information |
| Signature Marina Guard | Signature line (blank or digital) | For printing/signing |
| Signature Supervisor | Signature line (blank or digital) | For supervisor signature |

## User Flow

### Starting from Log Detail View

```
1. Guard/Supervisor opens log detail
2. Clicks "Generate Incident Report" button
3. System validates log has incident data
4. Opens "Generate Report" dialog with preview/options
5. User can:
   - Review auto-populated fields
   - Fill in missing fields (Supervisor on Duty, Who Was Notified)
   - Edit any field if needed
   - Choose format (PDF, Print HTML)
6. Click "Generate Report"
7. Document is created and:
   - Downloaded as PDF, or
   - Opened in new tab for printing
```

### Report Generation Dialog

```
┌─────────────────────────────────────────────────┐
│ Generate Incident Report                  [X]  │
├─────────────────────────────────────────────────┤
│ This will create a formal incident report      │
│ document based on the log information.         │
│                                                 │
│ Report Details (Review/Edit)                   │
│                                                 │
│ Incident Number                                │
│ [Auto-generated: INC-2025-001234] 🔄           │
│                                                 │
│ Supervisor on Duty *                           │
│ [Dropdown: Select supervisor...]               │
│ or                                             │
│ [Text input: Enter name manually]              │
│                                                 │
│ Who Was Notified                               │
│ [Text input: e.g., Town PD, Supervisor...]     │
│                                                 │
│ Output Format                                  │
│ ○ PDF Document (Download)                      │
│ ○ HTML (Open for printing)                     │
│                                                 │
│ [Preview Button]                               │
├─────────────────────────────────────────────────┤
│         [Cancel]  [Generate Report]            │
└─────────────────────────────────────────────────┘
```

## Technical Implementation

### Phase 1: Server Action for Report Data

**File**: `lib/actions/incident-report-actions.ts`

```typescript
export async function generateIncidentReportData(
  logId: string,
  options: {
    supervisorOnDuty?: string
    whoWasNotified?: string
    incidentNumber?: string
  }
): Promise<Result<IncidentReportData>> {
  // 1. Fetch log with all relations
  // 2. Verify it's an incident type
  // 3. Generate incident number if not provided
  // 4. Format all data for report
  // 5. Return structured data
}
```

### Phase 2: PDF Generation (Using jsPDF or similar)

**File**: `lib/utils/pdf-generator.ts`

```typescript
export function generateIncidentReportPDF(
  data: IncidentReportData
): Blob {
  // Use jsPDF or react-pdf
  // Create multi-page PDF with proper formatting
  // Return as downloadable blob
}
```

### Phase 3: HTML Template

**File**: `components/reports/incident-report-template.tsx`

```typescript
export function IncidentReportTemplate({
  data
}: IncidentReportTemplateProps) {
  // Server-renderable React component
  // Styled for printing
  // Can be used for PDF or direct printing
}
```

### Phase 4: Dialog Component

**File**: `components/logs/generate-incident-report-dialog.tsx`

```typescript
export function GenerateIncidentReportDialog({
  open,
  onOpenChange,
  log
}: Props) {
  // Form for missing fields
  // Preview option
  // Generate and download
}
```

## Libraries Needed

### For PDF Generation
```bash
npm install jspdf
npm install @types/jspdf --save-dev
```

**OR**

```bash
npm install @react-pdf/renderer
```

### For Advanced Formatting
```bash
npm install html2canvas  # If converting HTML to PDF
npm install puppeteer    # Server-side PDF generation (heavier)
```

## Styling Requirements

- **Font**: Professional serif font (Times New Roman or similar)
- **Margins**: 1 inch all around
- **Header**: Bold, centered title
- **Sections**: Clear section headers (bold)
- **Spacing**: Proper line spacing for readability
- **Signature Lines**: Underscores with labels
- **Page Breaks**: Smart breaks between sections if multi-page

## Security & Privacy Considerations

1. **Authorization**: Only guard who created log or supervisors+ can generate report
2. **Audit Trail**: Log when reports are generated and by whom
3. **Data Sanitization**: Ensure no XSS in generated documents
4. **PII Protection**: Mark reports as confidential
5. **Access Control**: Reports should not be publicly accessible

## Future Enhancements

1. **Digital Signatures**: Allow guards/supervisors to sign digitally
2. **Batch Generation**: Generate reports for multiple incidents
3. **Email Integration**: Email report to supervisor automatically
4. **Template Customization**: Allow admins to customize report template
5. **Attachment Support**: Include photos/videos in report
6. **Report History**: Track all generated reports for an incident
7. **PDF Encryption**: Password-protect sensitive reports

## File Structure

```
lib/
  actions/
    incident-report-actions.ts       # Server action to prepare report data
  utils/
    pdf-generator.ts                  # PDF generation logic
    report-formatter.ts               # Format data for report
components/
  logs/
    generate-incident-report-dialog.tsx  # Dialog UI
  reports/
    incident-report-template.tsx      # Report HTML template
    incident-report-preview.tsx       # Preview before generation
```

## Testing Checklist

- [ ] Report generates with all fields populated
- [ ] Missing fields can be filled in dialog
- [ ] PDF downloads correctly
- [ ] Print version formats properly
- [ ] Multi-page reports paginate correctly
- [ ] Incident number is unique
- [ ] Only authorized users can generate
- [ ] Signatures lines print correctly
- [ ] Special characters render properly
- [ ] Long text doesn't break layout
- [ ] Report matches official format exactly

## Success Criteria

✅ **Feature is successful when**:
1. Reports match official Town of Islip format exactly
2. Reports can be generated from any incident-type log
3. Generated PDFs are professional and printable
4. Missing fields can be filled before generation
5. Reports include all required sections
6. Signature lines are present and properly spaced
7. Report generation is tracked/audited
8. Only authorized users can generate reports
9. Reports can be downloaded or printed
10. Multi-page reports format correctly
