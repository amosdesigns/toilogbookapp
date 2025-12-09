# Incident Report Form - Implementation Plan

## Overview
Create a form that auto-populates an incident report template using data from an existing log entry. The form allows reviewing and editing all fields before generating the final report document.

## User Story
> As a guard or supervisor, I want to generate a formal incident report from a log entry by filling in a form with auto-populated data, so I can create official documentation quickly and accurately.

## Form Requirements

### Auto-Populated Fields (from Log Data)
These fields are pre-filled but can be edited:

1. **Incident Number**: Auto-generated (e.g., INC-2025-001234)
2. **Time**: From `log.incidentTime` or `log.createdAt`
3. **Report Date**: From `log.createdAt`
4. **Location**: From `log.location.name`
5. **Incident Date**: From `log.incidentTime` or `log.createdAt`
6. **Marina Guard on Duty**: From `log.user.firstName + lastName`
7. **Incident Description**: From `log.description`
8. **Actions Taken**: From `log.actionsTaken`
9. **Follow Up**: From `log.followUpNotes`

### Manual Entry Fields (required by user)
These fields need to be filled in by the user:

1. **Supervisor on Duty**: Text input or dropdown (if shift has supervisor)
2. **Who Was Notified**: Text input (people/agencies notified)

### Signature Fields (for final document)
These appear on the generated document:

1. **Signature Marina Guard**: Blank line for physical signature
2. **Signature Supervisor**: Blank line for supervisor signature

### Optional Editable Fields
User can modify any auto-populated field if needed, including the Actions Taken section which has dedicated space in the form.

## Form Layout

```
┌─────────────────────────────────────────────────────────┐
│ Generate Incident Report from Log                 [X]  │
├─────────────────────────────────────────────────────────┤
│ [Scroll Area - Full form]                              │
│                                                         │
│ ═══════════════════════════════════════════════════════ │
│ REPORT HEADER                                          │
│ ═══════════════════════════════════════════════════════ │
│                                                         │
│ Incident Number                                        │
│ [INC-2025-001234                          ] 🔄 Auto    │
│                                                         │
│ Incident Time                                          │
│ [1:02 AM                                  ] 🔄 Auto    │
│                                                         │
│ Report Date                                            │
│ [August 21, 2025                          ] 🔄 Auto    │
│                                                         │
│ ═══════════════════════════════════════════════════════ │
│ LOCATION & PERSONNEL                                    │
│ ═══════════════════════════════════════════════════════ │
│                                                         │
│ Location                                               │
│ [East Islip Marina                        ] 🔄 Auto    │
│                                                         │
│ Incident Date                                          │
│ [August 2, 2025                           ] 🔄 Auto    │
│                                                         │
│ Marina Guard on Duty                                   │
│ [Jerome Amos                              ] 🔄 Auto    │
│                                                         │
│ Supervisor on Duty *                                   │
│ [Enter supervisor name...                 ]            │
│ 💡 Select from shift: [Martillo ▼] or enter manually  │
│                                                         │
│ Who Was Notified                                       │
│ [Enter who was notified...                ]            │
│ (e.g., Town PD, Supervisor Martinez, etc.)            │
│                                                         │
│ ═══════════════════════════════════════════════════════ │
│ INCIDENT DETAILS                                        │
│ ═══════════════════════════════════════════════════════ │
│                                                         │
│ Incident Description *                                 │
│ ┌─────────────────────────────────────────────────────┐│
│ │ On Sunday, August 2nd, at approximately 1:02 AM,   ││
│ │ a loud argument was noted by me at the hut coming  ││
│ │ from someplace inside the park...                  ││
│ │                                                     ││
│ │ [Auto-populated from log.description, editable]    ││
│ │                                                     ││
│ └─────────────────────────────────────────────────────┘│
│ Character count: 450 / 5000                            │
│                                                         │
│ ═══════════════════════════════════════════════════════ │
│ ACTIONS TAKEN                                           │
│ ═══════════════════════════════════════════════════════ │
│                                                         │
│ Actions Taken *                                        │
│ ┌─────────────────────────────────────────────────────┐│
│ │ I reported the incident to my supervisor along     ││
│ │ with the fact that earlier in the day, guards      ││
│ │ mentioned a problem...                             ││
│ │                                                     ││
│ │ [Auto-populated from log.actionsTaken, editable]   ││
│ │                                                     ││
│ └─────────────────────────────────────────────────────┘│
│ Character count: 380 / 5000                            │
│                                                         │
│ ═══════════════════════════════════════════════════════ │
│ FOLLOW UP                                               │
│ ═══════════════════════════════════════════════════════ │
│                                                         │
│ Follow Up                                              │
│ ┌─────────────────────────────────────────────────────┐│
│ │ It is my understanding that supervisor checked in  ││
│ │ with the restaurant staff about this issue...      ││
│ │                                                     ││
│ │ [Auto-populated from log.followUpNotes, editable]  ││
│ │                                                     ││
│ └─────────────────────────────────────────────────────┘│
│ Character count: 120 / 2000                            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Preview Report]  [Cancel]  [Generate & Download PDF] │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Create Validation Schema

**File**: `lib/validations/incident-report-form.ts`

```typescript
import { z } from "zod"

export const incidentReportFormSchema = z.object({
  // Auto-generated
  incidentNumber: z.string().min(1, "Incident number is required"),

  // Time fields
  incidentTime: z.string().min(1, "Incident time is required"),
  reportDate: z.string().min(1, "Report date is required"),
  incidentDate: z.string().min(1, "Incident date is required"),

  // Location & Personnel
  location: z.string().min(1, "Location is required"),
  guardOnDuty: z.string().min(1, "Guard name is required"),
  supervisorOnDuty: z.string().min(1, "Supervisor on duty is required"),
  whoWasNotified: z.string().optional(),

  // Incident details
  incidentDescription: z.string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description cannot exceed 5000 characters"),

  actionsTaken: z.string()
    .min(20, "Actions taken must be at least 20 characters")
    .max(5000, "Actions taken cannot exceed 5000 characters"),

  followUp: z.string()
    .max(2000, "Follow up cannot exceed 2000 characters")
    .optional(),
})

export type IncidentReportFormData = z.infer<typeof incidentReportFormSchema>
```

### Step 2: Create Form Component

**File**: `components/logs/incident-report-form-dialog.tsx`

```typescript
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Loader2 } from "lucide-react"
import { incidentReportFormSchema, type IncidentReportFormData } from "@/lib/validations/incident-report-form"
import { generateIncidentNumber } from "@/lib/utils/incident-report-helpers"
import { format } from "date-fns"
import type { Log, Location, User, Shift } from "@prisma/client"

type LogWithRelations = Log & {
  location: Location
  user: User
  shift?: (Shift & { supervisor?: User }) | null
}

interface IncidentReportFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: LogWithRelations
  onSubmit: (data: IncidentReportFormData) => Promise<void>
  onPreview: (data: IncidentReportFormData) => void
}

export function IncidentReportFormDialog({
  open,
  onOpenChange,
  log,
  onSubmit,
  onPreview,
}: IncidentReportFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Generate default values from log
  const defaultValues: IncidentReportFormData = {
    incidentNumber: generateIncidentNumber(log.id),
    incidentTime: log.incidentTime
      ? format(new Date(log.incidentTime), "h:mm a")
      : format(new Date(log.createdAt), "h:mm a"),
    reportDate: format(new Date(log.createdAt), "MMMM d, yyyy"),
    incidentDate: log.incidentTime
      ? format(new Date(log.incidentTime), "MMMM d, yyyy")
      : format(new Date(log.createdAt), "MMMM d, yyyy"),
    location: log.location.name,
    guardOnDuty: `${log.user.firstName} ${log.user.lastName}`,
    supervisorOnDuty: log.shift?.supervisor
      ? `${log.shift.supervisor.firstName} ${log.shift.supervisor.lastName}`
      : "",
    whoWasNotified: "",
    incidentDescription: log.description || "",
    actionsTaken: log.actionsTaken || "",
    followUp: log.followUpNotes || "",
  }

  const form = useForm<IncidentReportFormData>({
    resolver: zodResolver(incidentReportFormSchema),
    defaultValues,
  })

  const handleSubmit = async (data: IncidentReportFormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      onOpenChange(false)
    } catch (error) {
      console.error("Error generating report:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreview = () => {
    const data = form.getValues()
    onPreview(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Generate Incident Report</DialogTitle>
          <DialogDescription>
            Review and edit the incident report details. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-200px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

              {/* REPORT HEADER SECTION */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Report Header</h3>
                </div>
                <Separator className="mb-4" />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="incidentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Number</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input {...field} readOnly className="bg-muted" />
                            <Badge variant="secondary">Auto</Badge>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incidentTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Time</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input {...field} />
                            <Badge variant="secondary">Auto</Badge>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reportDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Date</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input {...field} />
                            <Badge variant="secondary">Auto</Badge>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* LOCATION & PERSONNEL SECTION */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Location & Personnel</h3>
                </div>
                <Separator className="mb-4" />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input {...field} />
                            <Badge variant="secondary">Auto</Badge>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incidentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Date</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input {...field} />
                            <Badge variant="secondary">Auto</Badge>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="guardOnDuty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marina Guard on Duty</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input {...field} />
                            <Badge variant="secondary">Auto</Badge>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supervisorOnDuty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supervisor on Duty *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter supervisor name"
                          />
                        </FormControl>
                        <FormDescription>
                          {log.shift?.supervisor &&
                            `Suggested: ${log.shift.supervisor.firstName} ${log.shift.supervisor.lastName}`
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whoWasNotified"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Who Was Notified</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Town PD, Supervisor Martinez, etc."
                          />
                        </FormControl>
                        <FormDescription>
                          List people or agencies that were notified about this incident
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* INCIDENT DETAILS SECTION */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Incident Details</h3>
                </div>
                <Separator className="mb-4" />

                <FormField
                  control={form.control}
                  name="incidentDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe what happened..."
                          className="min-h-[200px] font-serif"
                          rows={10}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0} / 5000 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ACTIONS TAKEN SECTION */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Actions Taken</h3>
                </div>
                <Separator className="mb-4" />

                <FormField
                  control={form.control}
                  name="actionsTaken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actions Taken *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe what actions were taken..."
                          className="min-h-[150px] font-serif"
                          rows={8}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0} / 5000 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* FOLLOW UP SECTION */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Follow Up</h3>
                </div>
                <Separator className="mb-4" />

                <FormField
                  control={form.control}
                  name="followUp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow Up</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe any follow-up actions or status..."
                          className="min-h-[100px] font-serif"
                          rows={5}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0} / 2000 characters (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </ScrollArea>

        {/* FOOTER ACTIONS */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Report
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate & Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Step 3: Helper Functions

**File**: `lib/utils/incident-report-helpers.ts`

```typescript
/**
 * Generate a unique incident number
 * Format: INC-YYYY-NNNNNN
 */
export function generateIncidentNumber(logId: string): string {
  const year = new Date().getFullYear()
  const paddedId = logId.slice(-6).padStart(6, '0')
  return `INC-${year}-${paddedId}`
}

/**
 * Format date for incident report
 */
export function formatReportDate(date: Date | string): string {
  return format(new Date(date), "MMMM d, yyyy")
}

/**
 * Format time for incident report
 */
export function formatReportTime(date: Date | string): string {
  return format(new Date(date), "h:mm a")
}
```

### Step 4: Integration in Log Detail Dialog

**File**: `components/logs/log-detail-dialog.tsx` (modifications)

```typescript
// Add state
const [showIncidentReportDialog, setShowIncidentReportDialog] = useState(false)

// Add button in footer (for incident-type logs)
{log.type === "INCIDENT" && (
  <Button
    onClick={() => setShowIncidentReportDialog(true)}
    variant="default"
  >
    <FileText className="h-4 w-4 mr-2" />
    Generate Report
  </Button>
)}

// Add dialog
<IncidentReportFormDialog
  open={showIncidentReportDialog}
  onOpenChange={setShowIncidentReportDialog}
  log={log}
  onSubmit={handleGenerateReport}
  onPreview={handlePreviewReport}
/>
```

## Next Steps

1. ✅ Create validation schema
2. ✅ Create form dialog component
3. ⬜ Create PDF generation logic
4. ⬜ Create preview component
5. ⬜ Integrate with log detail dialog
6. ⬜ Test with sample data
7. ⬜ Polish UI/UX

Would you like me to start implementing these components?
