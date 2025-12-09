# Incident Report - Digital Signatures & Notifications

## Overview
Enhanced incident report system with:
1. **Digital signatures** - Guard and Supervisor electronically sign with timestamp
2. **Notification system** - Notify users within the system about incidents

## Digital Signature System

### Signature Data Structure

```typescript
interface DigitalSignature {
  signedBy: string          // User ID
  signedByName: string      // Full name
  signedAt: Date            // Timestamp
  ipAddress?: string        // Optional: for audit trail
  role: "GUARD" | "SUPERVISOR" | "ADMIN"
}

interface IncidentReportSignatures {
  guardSignature: DigitalSignature
  supervisorSignature?: DigitalSignature  // Optional until supervisor signs
}
```

### Database Schema Addition

```prisma
model IncidentReportGeneration {
  id                    String   @id @default(cuid())
  logId                 String   // Link to original log
  log                   Log      @relation(fields: [logId], references: [id], onDelete: Cascade)

  // Report metadata
  incidentNumber        String   @unique
  generatedAt           DateTime @default(now())
  generatedBy           String   // User ID who generated

  // Guard signature (required at generation)
  guardSignedBy         String   // User ID
  guardSignedByName     String   // Full name
  guardSignedAt         DateTime
  guardIpAddress        String?

  // Supervisor signature (can be added later)
  supervisorSignedBy    String?
  supervisorSignedByName String?
  supervisorSignedAt    DateTime?
  supervisorIpAddress   String?

  // PDF storage
  pdfUrl                String?  // Cloud storage URL if storing PDFs
  pdfStoredAt           DateTime?

  // Notification tracking
  notifiedUsers         String[] // Array of user IDs notified

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([logId])
  @@index([incidentNumber])
}
```

### Signature Workflow

#### Option 1: Sign at Generation (Recommended)

```
1. User clicks "Generate Incident Report"
2. Form opens with pre-filled data
3. User reviews/edits information
4. User clicks "Preview Report"
5. Preview dialog shows:
   - Full report preview
   - "Sign & Generate Report" button
6. User clicks "Sign & Generate Report"
7. System:
   - Records digital signature (name, timestamp, IP)
   - Generates PDF with signature line showing:
     "Digitally signed by [Name] on [Date] at [Time]"
   - Downloads PDF
   - Saves generation record to database
8. Supervisor can sign later
```

#### Option 2: Separate Signing Step

```
1. Generate report (unsigned)
2. Send to guard for signature
3. Guard signs digitally
4. Send to supervisor for signature
5. Supervisor signs digitally
6. Report marked as complete
```

**Recommendation**: Use Option 1 - sign at generation for simplicity.

### Signature UI Components

#### Guard Signature (At Generation)

```
┌────────────────────────────────────────────────┐
│ Sign Report as Guard                           │
├────────────────────────────────────────────────┤
│                                                │
│ By clicking "Sign & Generate Report" below,   │
│ you confirm that:                              │
│                                                │
│ ✓ The information in this report is accurate  │
│ ✓ You were the guard on duty                  │
│ ✓ This is an official incident report         │
│                                                │
│ Your digital signature:                        │
│ ┌────────────────────────────────────────────┐│
│ │ Jerome Amos                                ││
│ │ Guard - East Islip Marina                  ││
│ │ December 4, 2025 at 10:45 AM               ││
│ └────────────────────────────────────────────┘│
│                                                │
│          [Cancel]  [Sign & Generate Report]    │
└────────────────────────────────────────────────┘
```

#### Supervisor Signature Dialog (Later)

```
┌────────────────────────────────────────────────┐
│ Sign Incident Report as Supervisor        [X] │
├────────────────────────────────────────────────┤
│                                                │
│ Incident # INC-2025-001234                     │
│ Report Date: August 21, 2025                   │
│ Guard: Jerome Amos                             │
│                                                │
│ [View Full Report PDF]                         │
│                                                │
│ ─────────────────────────────────────────────  │
│                                                │
│ By signing, you confirm that:                  │
│                                                │
│ ✓ You have reviewed this incident report      │
│ ✓ The guard's account is accurate             │
│ ✓ Appropriate actions were taken              │
│                                                │
│ Supervisor Signature                           │
│ ┌────────────────────────────────────────────┐│
│ │ Martillo                                   ││
│ │ Supervisor - East Islip Marina             ││
│ │ December 5, 2025 at 9:15 AM                ││
│ └────────────────────────────────────────────┘│
│                                                │
│ Supervisor Notes (Optional)                    │
│ ┌────────────────────────────────────────────┐│
│ │ Reviewed and approved. Follow-up completed.││
│ │                                            ││
│ └────────────────────────────────────────────┘│
│                                                │
│              [Cancel]  [Sign Report]           │
└────────────────────────────────────────────────┘
```

### PDF Signature Display

#### Signed Report (Bottom of PDF)

```
──────────────────────────────────────────────────

DIGITAL SIGNATURES

Guard Signature:
Digitally signed by Jerome Amos on August 21, 2025 at 3:45 PM EST
Role: Marina Guard
Location: East Islip Marina


Supervisor Signature:
Digitally signed by Martillo on August 22, 2025 at 9:15 AM EST
Role: Supervisor
Location: East Islip Marina

──────────────────────────────────────────────────

Physical Signature Lines (if needed for filing):

Signature Marina Guard: ____________________________________________

Date: ______________


Signature Supervisor: _______________________________________________

Date: ______________
```

## Notification System

### Notification Types

```typescript
enum IncidentNotificationType {
  NEW_INCIDENT_REPORT = "NEW_INCIDENT_REPORT",
  AWAITING_SUPERVISOR_SIGNATURE = "AWAITING_SUPERVISOR_SIGNATURE",
  REPORT_SIGNED_BY_SUPERVISOR = "REPORT_SIGNED_BY_SUPERVISOR",
  HIGH_SEVERITY_INCIDENT = "HIGH_SEVERITY_INCIDENT",
  FOLLOW_UP_REQUIRED = "FOLLOW_UP_REQUIRED"
}
```

### Notification Database Model

```prisma
model IncidentNotification {
  id                    String   @id @default(cuid())

  // Link to report
  reportGenerationId    String
  reportGeneration      IncidentReportGeneration @relation(fields: [reportGenerationId], references: [id], onDelete: Cascade)

  // Notification details
  type                  String   // IncidentNotificationType enum
  recipientId           String   // User ID to notify
  recipient             User     @relation(fields: [recipientId], references: [id])

  // Status
  sentAt                DateTime @default(now())
  readAt                DateTime?
  acknowledgedAt        DateTime?

  // Content
  title                 String
  message               String
  priority              String   @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT

  // Optional action link
  actionUrl             String?
  actionLabel           String?

  createdAt             DateTime @default(now())

  @@index([recipientId, readAt])
  @@index([reportGenerationId])
}
```

### Who Gets Notified

#### New Incident Report Generated
**Recipients**:
- Assigned supervisor (from shift)
- All supervisors at the location
- Admin users (optional - configurable)

**Notification**:
```
Title: "New Incident Report Generated"
Message: "Jerome Amos created an incident report for East Islip Marina
         on August 2, 2025. Severity: HIGH. Awaiting supervisor signature."
Priority: Based on incident severity
Action: "View Report" → Opens report in new tab or signature dialog
```

#### High Severity Incident
**Recipients**:
- All supervisors
- All admins
- Optionally: Specific users (configurable per location)

**Notification**:
```
Title: "HIGH SEVERITY Incident Report"
Message: "CRITICAL incident reported at East Islip Marina by Jerome Amos.
         Immediate attention required."
Priority: URGENT
Action: "View Report"
```

#### Awaiting Supervisor Signature
**Recipients**:
- Assigned supervisor
- Backup supervisors after 24 hours

**Notification**:
```
Title: "Incident Report Awaiting Your Signature"
Message: "Incident report #INC-2025-001234 from August 2 needs your review
         and signature."
Priority: MEDIUM (HIGH after 24 hours)
Action: "Sign Report"
```

#### Report Signed by Supervisor
**Recipients**:
- Original guard who created report
- Admin users (for records)

**Notification**:
```
Title: "Supervisor Signed Your Incident Report"
Message: "Martillo has reviewed and signed your incident report
         #INC-2025-001234."
Priority: LOW
Action: "View Signed Report"
```

### Notification UI

#### In-App Notification Banner
Use existing notification banner system (already implemented):

```typescript
// When incident report generated
await createNotification({
  userId: supervisorId, // or null for all supervisors
  type: "ALERT",
  priority: incident.severity === "CRITICAL" ? "URGENT" : "HIGH",
  title: "New Incident Report",
  message: `${guardName} created incident report #${incidentNumber} at ${location}`,
  dismissible: true
})
```

#### Dashboard Alert Card

```
┌────────────────────────────────────────────────┐
│ 🔔 Pending Incident Reports (3)                │
├────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────┐ │
│ │ ⚠️ CRITICAL - East Islip Marina           │ │
│ │ Report #INC-2025-001234                   │ │
│ │ By Jerome Amos on Aug 2, 2025             │ │
│ │ Awaiting your signature                   │ │
│ │ [Sign Report]                             │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ 🟡 HIGH - Atlantique Marina               │ │
│ │ Report #INC-2025-001235                   │ │
│ │ By Maria Garcia on Aug 3, 2025            │ │
│ │ [Sign Report]                             │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ [View All Pending Reports]                     │
└────────────────────────────────────────────────┘
```

### Notification Settings

Allow users to configure:
- Email notifications (on/off)
- SMS notifications (on/off, if implemented)
- Notification priorities to receive
- Quiet hours

```typescript
interface UserNotificationPreferences {
  emailOnNewIncident: boolean
  emailOnHighSeverity: boolean
  emailOnAwaitingSignature: boolean

  pushOnNewIncident: boolean
  pushOnHighSeverity: boolean

  quietHoursStart?: string  // "22:00"
  quietHoursEnd?: string    // "07:00"
}
```

## Implementation Steps

### Phase 1: Digital Signatures (Core)

1. **Database Migration**
   - Add `IncidentReportGeneration` table
   - Link to existing `Log` table

2. **Server Actions**
   - `generateIncidentReport(logId, formData, signature)` - Create report with guard signature
   - `signIncidentReport(reportId, signature)` - Add supervisor signature
   - `getUnsignedReports()` - Get reports awaiting supervisor signature

3. **Components**
   - `DigitalSignatureDialog` - Shows signature confirmation
   - `SignReportDialog` - Supervisor signs existing report
   - `SignedReportsTable` - Admin view of all signed reports

### Phase 2: Notifications (Basic)

1. **Database Migration**
   - Add `IncidentNotification` table
   - Relations to users and reports

2. **Server Actions**
   - `createIncidentNotification(recipients, reportId, type)` - Send notification
   - `getIncidentNotifications()` - Get user's notifications
   - `markNotificationRead(notificationId)` - Mark as read

3. **UI Integration**
   - Use existing notification banner
   - Add incident report notifications section to dashboard

### Phase 3: Enhanced Features

1. **Email Notifications** (via Resend or similar)
2. **SMS Notifications** (via Twilio)
3. **Notification Preferences** page
4. **Report Analytics** - Track signature times, pending reports

## Security Considerations

1. **Signature Authentication**
   - Verify user is logged in
   - Verify user has permission to sign (correct role)
   - Record IP address for audit trail

2. **Report Integrity**
   - Once signed, report data should be immutable
   - Store hash of report content with signature
   - Detect if report was modified after signing

3. **Access Control**
   - **ONLY SUPERVISORS OR HIGHER can generate incident reports** (Guards cannot start reports)
   - Supervisors can generate reports for any log at their locations
   - Admins and Super Admins can generate reports for any log
   - Guards must be assigned by supervisor if guard signature is needed
   - Supervisors can sign any report at their locations
   - Admins can view all reports

## Testing Scenarios

### Digital Signatures
- [ ] Guard generates report and signs it
- [ ] PDF shows digital signature with timestamp
- [ ] Supervisor opens unsigned report
- [ ] Supervisor signs report
- [ ] PDF regenerates with both signatures
- [ ] Signature can't be added without authentication
- [ ] Wrong role can't sign (guard can't supervisor-sign)

### Notifications
- [ ] New report notifies assigned supervisor
- [ ] High severity notifies all supervisors
- [ ] Notification appears in banner
- [ ] Notification marked read when clicked
- [ ] Email sent if enabled in preferences
- [ ] No notifications during quiet hours

## UI Mockup: Complete Flow

```
1. Guard: Generate Report Button
   └─> Opens IncidentReportFormDialog
       └─> User fills/reviews data
           └─> Clicks "Preview & Sign"
               └─> Opens DigitalSignatureDialog
                   ├─> Shows signature preview
                   ├─> "Sign & Generate" button
                   └─> PDF downloads with digital signature

2. System: Creates Notifications
   ├─> Notifies assigned supervisor
   ├─> Notifies all supervisors (if high severity)
   └─> Shows in notification banner

3. Supervisor: Receives Notification
   └─> Clicks "Sign Report" in notification
       └─> Opens SignReportDialog
           ├─> Shows report preview
           ├─> Signature confirmation
           ├─> Optional notes field
           └─> "Sign Report" button
               └─> PDF regenerates with both signatures

4. Guard: Receives Notification
   └─> "Your report was signed by Supervisor"
       └─> Can download final signed PDF
```

## Benefits

### Digital Signatures
✅ **Instant verification** - No waiting for physical signatures
✅ **Audit trail** - Exact timestamp and user recorded
✅ **Remote signing** - Supervisor can sign from anywhere
✅ **Immutable record** - Can't be backdated or forged
✅ **Faster workflow** - No paper routing required

### Notifications
✅ **Immediate awareness** - Supervisors know right away
✅ **Priority handling** - Critical incidents get urgent attention
✅ **Accountability** - Track who was notified and when
✅ **Follow-up** - Ensure reports don't get lost
✅ **Team communication** - Everyone stays informed

## Next Implementation Priority

**Recommended order**:
1. ✅ Build form and PDF generation (base functionality)
2. 🔨 Add guard digital signature at generation
3. 🔨 Add supervisor signature capability
4. 🔨 Implement basic notifications (in-app only)
5. 📋 Add pending reports dashboard card
6. 📋 Add email notifications (optional, Phase 2)

Ready to start implementing?
