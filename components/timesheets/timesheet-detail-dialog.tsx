"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/utils"
import { Calendar, Clock, User, MapPin, AlertCircle } from "lucide-react"

interface TimesheetEntry {
  id: string
  date: Date
  clockInTime: Date
  clockOutTime: Date
  hoursWorked: number
  location: {
    name: string
  }
  shift?: {
    name: string
  } | null
  wasAdjusted: boolean
  wasManuallyAdded: boolean
  originalHours?: number
}

interface TimesheetAdjustment {
  id: string
  reason: string
  createdAt: Date
  adjustedBy: {
    firstName: string
    lastName: string
  }
}

interface Timesheet {
  id: string
  weekStartDate: Date
  weekEndDate: Date
  totalHours: number
  totalEntries: number
  status: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  entries: TimesheetEntry[]
  adjustments?: TimesheetAdjustment[]
  approver?: {
    firstName: string
    lastName: string
  } | null
  rejector?: {
    firstName: string
    lastName: string
  } | null
  rejectionReason?: string | null
  submittedAt?: Date | null
  approvedAt?: Date | null
  rejectedAt?: Date | null
}

interface TimesheetDetailDialogProps {
  timesheet: Timesheet | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function TimesheetDetailDialog({
  timesheet,
  open,
  onOpenChange,
}: TimesheetDetailDialogProps) {
  if (!timesheet) return null

  const formatWeekRange = (start: Date, end: Date) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {timesheet.user.firstName} {timesheet.user.lastName}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {formatWeekRange(timesheet.weekStartDate, timesheet.weekEndDate)}
              </DialogDescription>
            </div>
            <Badge className={statusColors[timesheet.status]}>
              {timesheet.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-lg font-semibold">{timesheet.totalHours.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-lg font-semibold">{timesheet.totalEntries}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Time Entries */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Time Entries</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Shift</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheet.entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {entry.location.name}
                        </div>
                      </TableCell>
                      <TableCell>{formatTime(entry.clockInTime)}</TableCell>
                      <TableCell>{formatTime(entry.clockOutTime)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {entry.hoursWorked.toFixed(2)}
                          </span>
                          {entry.wasAdjusted && (
                            <Badge variant="outline" className="text-xs">
                              Adjusted
                            </Badge>
                          )}
                          {entry.wasManuallyAdded && (
                            <Badge variant="outline" className="text-xs">
                              Manual
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.shift?.name || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Adjustments */}
          {timesheet.adjustments && timesheet.adjustments.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Adjustments
                </h3>
                <div className="space-y-3">
                  {timesheet.adjustments.map((adjustment) => (
                    <div
                      key={adjustment.id}
                      className="border rounded-lg p-3 bg-muted/50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{adjustment.reason}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Adjusted by {adjustment.adjustedBy.firstName}{" "}
                            {adjustment.adjustedBy.lastName}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(adjustment.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Approval/Rejection Info */}
          {(timesheet.approver || timesheet.rejector) && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Review Information</h3>
                <div className="space-y-2">
                  {timesheet.submittedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Submitted:</span>
                      <span>{formatDateTime(timesheet.submittedAt)}</span>
                    </div>
                  )}
                  {timesheet.approver && timesheet.approvedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Approved by:</span>
                      <span>
                        {timesheet.approver.firstName} {timesheet.approver.lastName}
                      </span>
                      <span className="text-muted-foreground">on</span>
                      <span>{formatDateTime(timesheet.approvedAt)}</span>
                    </div>
                  )}
                  {timesheet.rejector && timesheet.rejectedAt && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Rejected by:</span>
                        <span>
                          {timesheet.rejector.firstName} {timesheet.rejector.lastName}
                        </span>
                        <span className="text-muted-foreground">on</span>
                        <span>{formatDateTime(timesheet.rejectedAt)}</span>
                      </div>
                      {timesheet.rejectionReason && (
                        <div className="border rounded-lg p-3 bg-red-50 dark:bg-red-950">
                          <p className="text-sm font-medium text-red-900 dark:text-red-100">
                            Rejection Reason:
                          </p>
                          <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                            {timesheet.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
