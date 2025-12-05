# Incident Report from Log Detail - Implementation Plan

## Overview
Add the ability to convert/escalate a regular log entry into an incident report directly from the log detail view. This allows guards to initially create a simple log entry, then later upgrade it to a full incident report with additional details.

## Current State Analysis

### Existing Functionality
1. **Log Model** contains all incident fields (severity, incidentTime, peopleInvolved, etc.)
2. **Log Detail Dialog** shows incident-specific fields when `type === "INCIDENT"`
3. **Incident Review Dialog** exists for supervisor review workflow
4. **Incident Report Form** exists for creating/editing full incidents
5. **Log types**: INCIDENT, PATROL, VISITOR_CHECKIN, MAINTENANCE, WEATHER, OTHER

### User Story
> As a guard, I want to convert a regular log entry into an incident report so that I can initially log basic information quickly, then later provide full incident details when I have more time or information.

## Implementation Plan

### Phase 1: UI Enhancement - Add "Convert to Incident" Button

#### 1.1 Update Log Detail Dialog Component
**File**: `components/logs/log-detail-dialog.tsx`

**Changes**:
- Add "Convert to Incident" button in dialog footer
- Only show button when:
  - Log type is NOT already "INCIDENT"
  - User is the log creator OR user is a supervisor/admin
  - Log status is not "ARCHIVED"
- Button should be visually distinct (e.g., orange/warning variant)
- Button opens a confirmation dialog before conversion

**Visual Layout**:
```
┌─────────────────────────────────────────┐
│ Log Detail                         [X]  │
├─────────────────────────────────────────┤
│ [Current log details display...]       │
│                                         │
│ [... rest of content ...]              │
├─────────────────────────────────────────┤
│ [Close]    [Convert to Incident] [Edit]│
└─────────────────────────────────────────┘
```

#### 1.2 Create Incident Conversion Dialog
**New File**: `components/logs/convert-to-incident-dialog.tsx`

**Purpose**: Confirmation dialog that explains what will happen

**Features**:
- Explain that the log will be upgraded to incident type
- Show a preview of additional fields that will need to be filled
- "Cancel" and "Continue" buttons
- After confirmation, open the incident details form

**Dialog Content**:
```
┌────────────────────────────────────────────┐
│ Convert to Incident Report           [X]  │
├────────────────────────────────────────────┤
│ ⚠️ This will convert the log entry into a │
│    formal incident report.                 │
│                                            │
│ You'll need to provide:                   │
│ • Incident severity level                 │
│ • Exact incident time                     │
│ • People involved                         │
│ • Actions taken                           │
│ • Additional details                      │
│                                            │
│ The original log information will be      │
│ preserved and additional incident fields  │
│ will be added.                            │
├────────────────────────────────────────────┤
│              [Cancel]  [Continue]          │
└────────────────────────────────────────────┘
```

#### 1.3 Create Incident Details Form Dialog
**New File**: `components/logs/add-incident-details-dialog.tsx`

**Purpose**: Form to capture incident-specific details for the existing log

**Features**:
- Pre-populate with existing log data (title, description, location, time)
- Focus on incident-specific fields that are currently empty:
  - **Severity** (required dropdown): LOW, MEDIUM, HIGH, CRITICAL
  - **Incident Time** (optional, defaults to log createdAt)
  - **People Involved** (textarea)
  - **Witnesses** (textarea)
  - **Actions Taken** (required textarea, min 10 chars)
  - **Weather Conditions** (text input)
  - **Follow-up Required** (checkbox)
  - **Follow-up Notes** (conditional textarea if checkbox checked)
- Show read-only section at top with original log info
- Validation using Zod schema
- "Cancel" and "Convert to Incident" buttons

**Form Layout**:
```
┌───────────────────────────────────────────────┐
│ Add Incident Details                     [X] │
├───────────────────────────────────────────────┤
│ Original Log Entry (Read-only)               │
│ ┌───────────────────────────────────────────┐│
│ │ Title: Suspicious activity at dock 3     ││
│ │ Location: Atlantique Marina              ││
│ │ Time: Dec 4, 2025 10:30 AM               ││
│ │ Description: [original description...]   ││
│ └───────────────────────────────────────────┘│
│                                               │
│ Incident Details (Required)                  │
│                                               │
│ Severity Level *                             │
│ [Dropdown: Select severity...]               │
│                                               │
│ Incident Time (if different from log time)   │
│ [Date/Time Picker]                           │
│                                               │
│ People Involved                              │
│ [Textarea: Names/descriptions...]            │
│                                               │
│ Witnesses                                    │
│ [Textarea: Witness names/contact...]         │
│                                               │
│ Actions Taken *                              │
│ [Textarea: What did you do?...]             │
│                                               │
│ Weather Conditions                           │
│ [Input: Clear, Rainy, Foggy...]             │
│                                               │
│ ☐ Follow-up Required                        │
│ [Conditional: Follow-up Notes textarea]      │
├───────────────────────────────────────────────┤
│         [Cancel]  [Convert to Incident]      │
└───────────────────────────────────────────────┘
```

### Phase 2: Server Actions

#### 2.1 Create Conversion Server Action
**File**: `lib/actions/log-actions.ts`

**New Function**: `convertLogToIncident(logId: string, incidentData: IncidentData): Promise<Result<Log>>`

**Logic**:
```typescript
1. Authenticate user
2. Get existing log from database
3. Verify permissions:
   - User owns the log OR
   - User is supervisor/admin
4. Verify log is not already an incident
5. Verify log is not archived
6. Update log with transaction:
   - Set type = "INCIDENT"
   - Update incident-specific fields from incidentData
   - Preserve original createdAt, userId, title, description
   - Set status = "LIVE" if currently "DRAFT"
   - Update updatedAt timestamp
7. Revalidate paths: /logs, /dashboard/logs
8. Return updated log
```

**Parameters Type**:
```typescript
interface IncidentData {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  incidentTime?: Date
  peopleInvolved?: string
  witnesses?: string
  actionsTaken: string
  weatherConditions?: string
  followUpRequired?: boolean
  followUpNotes?: string
}
```

**Error Handling**:
- Unauthorized if user doesn't have permission
- Not found if log doesn't exist
- Invalid state if log is already incident type
- Invalid state if log is archived
- Validation errors for required fields

### Phase 3: Validation Schema

#### 3.1 Create Incident Conversion Schema
**File**: `lib/validations/incident-conversion.ts`

**Schema**:
```typescript
export const incidentConversionSchema = z.object({
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
    required_error: "Please select a severity level",
  }),
  incidentTime: z.date().optional(),
  peopleInvolved: z.string().optional(),
  witnesses: z.string().optional(),
  actionsTaken: z.string()
    .min(10, "Actions taken must be at least 10 characters")
    .max(2000, "Actions taken must be less than 2000 characters"),
  weatherConditions: z.string().max(100).optional(),
  followUpRequired: z.boolean().optional().default(false),
  followUpNotes: z.string()
    .max(1000, "Follow-up notes must be less than 1000 characters")
    .optional(),
}).refine(
  (data) => {
    // If follow-up is required, notes must be provided
    if (data.followUpRequired && !data.followUpNotes?.trim()) {
      return false;
    }
    return true;
  },
  {
    message: "Follow-up notes are required when follow-up is marked as required",
    path: ["followUpNotes"],
  }
)

export type IncidentConversionFormData = z.infer<typeof incidentConversionSchema>
```

### Phase 4: Integration Points

#### 4.1 Log Detail Dialog Updates
**File**: `components/logs/log-detail-dialog.tsx`

**Changes**:
1. Add state for conversion dialog: `const [showConvertDialog, setShowConvertDialog] = useState(false)`
2. Add state for incident details dialog: `const [showIncidentDetailsDialog, setShowIncidentDetailsDialog] = useState(false)`
3. Add button in footer:
```tsx
{log.type !== "INCIDENT" && canConvert && (
  <Button
    variant="warning"
    onClick={() => setShowConvertDialog(true)}
  >
    <AlertCircle className="h-4 w-4 mr-2" />
    Convert to Incident
  </Button>
)}
```
4. Add dialog components:
```tsx
<ConvertToIncidentDialog
  open={showConvertDialog}
  onOpenChange={setShowConvertDialog}
  onContinue={() => {
    setShowConvertDialog(false)
    setShowIncidentDetailsDialog(true)
  }}
/>

<AddIncidentDetailsDialog
  open={showIncidentDetailsDialog}
  onOpenChange={setShowIncidentDetailsDialog}
  log={log}
  onSuccess={handleConversionSuccess}
/>
```

#### 4.2 Permission Helper
**File**: `lib/utils/log-permissions.ts` (create if doesn't exist)

**Function**: `canConvertToIncident(log: Log, currentUser: User): boolean`

**Logic**:
```typescript
export function canConvertToIncident(log: Log, currentUser: User): boolean {
  // Can't convert if already an incident
  if (log.type === "INCIDENT") return false

  // Can't convert if archived
  if (log.status === "ARCHIVED" || log.archivedAt) return false

  // User owns the log
  if (log.userId === currentUser.id) return true

  // User is supervisor or higher
  if (["SUPERVISOR", "ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
    return true
  }

  return false
}
```

### Phase 5: User Experience Flows

#### Flow 1: Guard Converts Own Log
```
1. Guard creates quick patrol log: "Checked dock area - all clear"
2. Later, guard remembers more details about suspicious person
3. Guard opens log detail → clicks "Convert to Incident"
4. Confirmation dialog appears → clicks "Continue"
5. Incident details form opens with original log info pre-filled
6. Guard fills in severity, people involved, actions taken
7. Guard clicks "Convert to Incident"
8. Success toast: "Log converted to incident report"
9. Detail dialog updates to show incident-specific sections
10. Log type badge changes to "INCIDENT"
```

#### Flow 2: Supervisor Escalates Log to Incident
```
1. Guard creates log: "Vehicle parked in restricted area"
2. Supervisor reviews logs and determines it needs investigation
3. Supervisor opens log detail → clicks "Convert to Incident"
4. Confirmation dialog → "Continue"
5. Supervisor fills incident details based on their assessment
6. Supervisor converts, marking as HIGH severity
7. Incident appears in supervisor incident review dashboard
8. Supervisor can now assign follow-up or review later
```

### Phase 6: Testing Checklist

#### Unit Tests (if implementing)
- [ ] Validation schema accepts valid incident data
- [ ] Validation schema rejects invalid severity levels
- [ ] Validation schema requires actionsTaken
- [ ] Validation schema enforces followUpNotes when followUpRequired is true

#### Integration Tests
- [ ] Server action converts log to incident successfully
- [ ] Server action preserves original log data
- [ ] Server action rejects unauthorized users
- [ ] Server action rejects already-incident logs
- [ ] Server action rejects archived logs

#### Manual Testing
- [ ] "Convert to Incident" button only shows for eligible logs
- [ ] Button doesn't show for incident-type logs
- [ ] Button doesn't show for archived logs
- [ ] Confirmation dialog displays correctly
- [ ] Incident details form pre-populates with log data
- [ ] Form validation works (required fields, min/max lengths)
- [ ] Successful conversion updates UI immediately
- [ ] Converted incident shows all incident-specific sections
- [ ] Log type badge updates to "INCIDENT"
- [ ] Toast notification appears on success
- [ ] Error handling works (show error messages)
- [ ] Permissions work correctly (own logs + supervisors)
- [ ] Conversion persists after page refresh

### Phase 7: UI/UX Considerations

#### Visual Design
- **"Convert to Incident" button**: Use warning/orange color to indicate importance
- **Confirmation dialog icon**: Use AlertCircle or AlertTriangle icon
- **Form layout**: Clear section separation between read-only and editable
- **Success feedback**: Toast + immediate UI update (no page refresh needed)
- **Loading states**: Disable buttons and show spinners during conversion

#### Accessibility
- [ ] All dialogs have proper ARIA labels
- [ ] Focus management (dialog opens → focus on first field)
- [ ] Keyboard navigation (Tab through fields, Escape closes dialogs)
- [ ] Screen reader announcements for success/error
- [ ] Color contrast meets WCAG AA standards
- [ ] Error messages are associated with form fields

#### Mobile Responsiveness
- [ ] Dialogs stack properly on mobile (full width)
- [ ] Form fields are touch-friendly (min 44x44px tap targets)
- [ ] Textareas resize appropriately
- [ ] Date/time pickers work on mobile browsers
- [ ] Scrolling works within dialogs on small screens

### Phase 8: Future Enhancements (Not in Initial Scope)

1. **Bulk Conversion**: Allow supervisors to convert multiple logs to incidents at once
2. **Template Auto-fill**: Suggest incident details based on log description using AI
3. **Photo/Video Upload**: Enable adding media when converting to incident
4. **Email Notifications**: Notify supervisors when guard converts log to incident
5. **Audit Trail**: Log who converted the log and when in a separate audit table
6. **Revert Capability**: Allow converting incident back to regular log (with confirmation)
7. **Incident Categories**: Add categorization (theft, vandalism, safety, etc.)

## File Structure Summary

### New Files to Create
```
components/logs/convert-to-incident-dialog.tsx          # Confirmation dialog
components/logs/add-incident-details-dialog.tsx         # Incident details form
lib/validations/incident-conversion.ts                  # Zod validation schema
lib/utils/log-permissions.ts                            # Permission helper (if needed)
```

### Files to Modify
```
components/logs/log-detail-dialog.tsx                   # Add button + dialog triggers
lib/actions/log-actions.ts                              # Add convertLogToIncident action
```

## Implementation Order

1. ✅ **Research Phase**: Explore current implementation (COMPLETED)
2. ⬜ **Schema & Validation**: Create validation schema
3. ⬜ **Server Action**: Implement convertLogToIncident function
4. ⬜ **UI Components**: Build dialogs and forms
5. ⬜ **Integration**: Connect everything in log detail dialog
6. ⬜ **Testing**: Manual testing of all flows
7. ⬜ **Refinement**: Polish UI, error handling, loading states

## Success Criteria

✅ **Feature is successful when**:
1. Guards can convert their own logs to incidents from detail view
2. Supervisors can convert any log to incident
3. Conversion preserves all original log data
4. Incident-specific fields are properly captured and saved
5. UI updates immediately after conversion (no refresh needed)
6. Proper permissions are enforced
7. Clear feedback is provided to user (success/error messages)
8. Converted incidents appear correctly in incident reports list
9. No bugs or edge cases in conversion flow
10. Feature works on both desktop and mobile

## Notes & Considerations

- **Database Impact**: No schema changes needed - Log model already has all incident fields
- **Backward Compatibility**: Existing logs remain unchanged unless explicitly converted
- **Reversibility**: Consider whether we want to allow converting back to non-incident (future)
- **Status Changes**: Converting to incident could automatically set status to LIVE
- **Supervisor Review**: Converted incidents should appear in supervisor review queue
- **Search/Filtering**: Ensure converted incidents appear correctly in filtered views
