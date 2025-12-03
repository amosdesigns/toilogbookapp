"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, Check, X, Trash2, Send, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { Prisma } from "@prisma/client"

type Decimal = Prisma.Decimal

const ITEMS_PER_PAGE = 20

interface TimesheetEntry {
  id: string
  date: Date
  clockInTime: Date
  clockOutTime: Date
  hoursWorked: Decimal | number
  location: {
    name: string
  } | null
  [key: string]: unknown
}

interface Timesheet {
  id: string
  weekStartDate: Date
  weekEndDate: Date
  totalHours: Decimal | number
  totalEntries: number
  status: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  entries: TimesheetEntry[]
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
  [key: string]: unknown
}

interface TimesheetsTableProps {
  timesheets: Timesheet[]
  onViewTimesheet: (timesheetId: string) => void
  onSubmitTimesheet?: (timesheetId: string) => void
  onApproveTimesheet?: (timesheetId: string) => void
  onRejectTimesheet?: (timesheetId: string) => void
  onDeleteTimesheet?: (timesheetId: string) => void
  onBulkApprove?: (timesheetIds: string[]) => void
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function TimesheetsTable({
  timesheets,
  onViewTimesheet,
  onSubmitTimesheet,
  onApproveTimesheet,
  onRejectTimesheet,
  onDeleteTimesheet,
  selectedIds = [],
  onSelectionChange,
}: TimesheetsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(timesheets.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentTimesheets = timesheets.slice(startIndex, endIndex)

  // Reset to page 1 when timesheets change
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1)
  }

  if (timesheets.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No timesheets found matching your filters.</p>
      </div>
    )
  }

  const formatWeekRange = (start: Date, end: Date) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  // Get selectable (pending) timesheets on current page
  const selectablePendingTimesheets = currentTimesheets.filter(t => t.status === 'PENDING')
  const selectablePendingIds = selectablePendingTimesheets.map(t => t.id)
  const allPagePendingSelected = selectablePendingIds.length > 0 && selectablePendingIds.every(id => selectedIds.includes(id))

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      // Add all pending IDs from current page
      const newSelection = [...new Set([...selectedIds, ...selectablePendingIds])]
      onSelectionChange(newSelection)
    } else {
      // Remove all pending IDs from current page
      const newSelection = selectedIds.filter(id => !selectablePendingIds.includes(id))
      onSelectionChange(newSelection)
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {onSelectionChange && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allPagePendingSelected}
                    onCheckedChange={handleSelectAll}
                    disabled={selectablePendingIds.length === 0}
                    aria-label="Select all pending timesheets"
                  />
                </TableHead>
              )}
              <TableHead>Employee</TableHead>
              <TableHead>Week Period</TableHead>
              <TableHead>Total Hours</TableHead>
              <TableHead>Entries</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTimesheets.map((timesheet) => (
              <TableRow key={timesheet.id}>
                {onSelectionChange && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(timesheet.id)}
                      onCheckedChange={(checked) => handleSelectOne(timesheet.id, checked as boolean)}
                      disabled={timesheet.status !== 'PENDING'}
                      aria-label={`Select timesheet for ${timesheet.user.firstName} ${timesheet.user.lastName}`}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {timesheet.user.firstName} {timesheet.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {timesheet.user.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {formatWeekRange(timesheet.weekStartDate, timesheet.weekEndDate)}
                </TableCell>
                <TableCell>
                  <span className="font-semibold">{typeof timesheet.totalHours === 'number' ? timesheet.totalHours.toFixed(2) : timesheet.totalHours.toNumber().toFixed(2)}</span> hrs
                </TableCell>
                <TableCell>{timesheet.totalEntries}</TableCell>
                <TableCell>
                  <Badge className={statusColors[timesheet.status] || statusColors.DRAFT}>
                    {timesheet.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {timesheet.submittedAt ? formatDateTime(timesheet.submittedAt) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewTimesheet(timesheet.id)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {onSubmitTimesheet && timesheet.status === "DRAFT" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSubmitTimesheet(timesheet.id)}
                        title="Submit for Approval"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {onApproveTimesheet && timesheet.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onApproveTimesheet(timesheet.id)}
                        title="Approve"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {onRejectTimesheet && timesheet.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRejectTimesheet(timesheet.id)}
                        title="Reject"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {onDeleteTimesheet && timesheet.status === "DRAFT" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteTimesheet(timesheet.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, timesheets.length)} of {timesheets.length} timesheets
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
