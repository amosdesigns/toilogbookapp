"use client"

import { useState, useEffect } from "react"
import { TimesheetFiltersHorizontal, type TimesheetFilters } from "@/components/timesheets/timesheet-filters-horizontal"
import { TimesheetsTable } from "@/components/timesheets/timesheets-table"
import { TimesheetDetailDialog } from "@/components/timesheets/timesheet-detail-dialog"
import {
  getTimesheets,
  getTimesheetById,
  submitTimesheet,
  approveTimesheet,
  rejectTimesheet,
  deleteTimesheet,
} from "@/lib/actions/timesheet-actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Plus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface User {
  id: string
  role: string
  firstName: string
  lastName: string
}

interface TimesheetManagementClientProps {
  user: User
  users: Array<{ id: string; firstName: string; lastName: string }>
}

export function TimesheetManagementClient({ user, users }: TimesheetManagementClientProps) {
  const router = useRouter()
  const [filters, setFilters] = useState<TimesheetFilters>({})
  const [timesheets, setTimesheets] = useState<any[]>([])
  const [selectedTimesheet, setSelectedTimesheet] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectTimesheetId, setRejectTimesheetId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  // Fetch timesheets whenever filters change
  useEffect(() => {
    const fetchTimesheets = async () => {
      setIsLoading(true)
      const result = await getTimesheets(filters)
      if (result.ok) {
        setTimesheets(result.data)
      } else {
        toast.error(result.message || "Failed to fetch timesheets")
      }
      setIsLoading(false)
    }

    fetchTimesheets()
  }, [filters])

  const handleViewTimesheet = async (timesheetId: string) => {
    const result = await getTimesheetById(timesheetId)
    if (result.ok) {
      setSelectedTimesheet(result.data)
      setIsDetailDialogOpen(true)
    } else {
      toast.error(result.message || "Failed to load timesheet details")
    }
  }

  const handleSubmitTimesheet = async (timesheetId: string) => {
    if (!confirm("Submit this timesheet for approval?")) return

    const result = await submitTimesheet(timesheetId)
    if (result.ok) {
      toast.success("Timesheet submitted for approval")
      // Refresh timesheets
      const updatedTimesheets = await getTimesheets(filters)
      if (updatedTimesheets.ok) {
        setTimesheets(updatedTimesheets.data)
      }
    } else {
      toast.error(result.message || "Failed to submit timesheet")
    }
  }

  const handleApproveTimesheet = async (timesheetId: string) => {
    if (!confirm("Approve this timesheet?")) return

    const result = await approveTimesheet(timesheetId)
    if (result.ok) {
      toast.success("Timesheet approved")
      // Refresh timesheets
      const updatedTimesheets = await getTimesheets(filters)
      if (updatedTimesheets.ok) {
        setTimesheets(updatedTimesheets.data)
      }
    } else {
      toast.error(result.message || "Failed to approve timesheet")
    }
  }

  const handleRejectTimesheet = (timesheetId: string) => {
    setRejectTimesheetId(timesheetId)
    setRejectionReason("")
    setIsRejectDialogOpen(true)
  }

  const handleConfirmReject = async () => {
    if (!rejectTimesheetId) return

    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }

    const result = await rejectTimesheet(rejectTimesheetId, rejectionReason)
    if (result.ok) {
      toast.success("Timesheet rejected")
      setIsRejectDialogOpen(false)
      setRejectTimesheetId(null)
      setRejectionReason("")
      // Refresh timesheets
      const updatedTimesheets = await getTimesheets(filters)
      if (updatedTimesheets.ok) {
        setTimesheets(updatedTimesheets.data)
      }
    } else {
      toast.error(result.message || "Failed to reject timesheet")
    }
  }

  const handleDeleteTimesheet = async (timesheetId: string) => {
    if (!confirm("Are you sure you want to delete this draft timesheet?")) return

    const result = await deleteTimesheet(timesheetId)
    if (result.ok) {
      toast.success("Timesheet deleted")
      // Refresh timesheets
      const updatedTimesheets = await getTimesheets(filters)
      if (updatedTimesheets.ok) {
        setTimesheets(updatedTimesheets.data)
      }
    } else {
      toast.error(result.message || "Failed to delete timesheet")
    }
  }

  const handleExport = () => {
    // Export timesheets to CSV
    const csvContent = [
      ["Employee", "Week Start", "Week End", "Total Hours", "Entries", "Status", "Submitted"],
      ...timesheets.map((timesheet) => [
        `${timesheet.user.firstName} ${timesheet.user.lastName}`,
        new Date(timesheet.weekStartDate).toLocaleDateString(),
        new Date(timesheet.weekEndDate).toLocaleDateString(),
        timesheet.totalHours.toFixed(2),
        timesheet.totalEntries.toString(),
        timesheet.status,
        timesheet.submittedAt ? new Date(timesheet.submittedAt).toLocaleDateString() : "-",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `timesheets-export-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast.success("Timesheets exported successfully")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timesheet Management</h1>
          <p className="text-muted-foreground mt-1">
            Review, approve, and manage employee timesheets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport} disabled={timesheets.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => router.push("/admin/dashboard/timesheets/generate")}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Timesheet
          </Button>
        </div>
      </div>

      {/* Filters */}
      <TimesheetFiltersHorizontal
        filters={filters}
        onFiltersChange={setFilters}
        users={users}
      />

      {/* Timesheets Table */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${timesheets.length} timesheet(s) found`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <TimesheetsTable
            timesheets={timesheets}
            onViewTimesheet={handleViewTimesheet}
            onSubmitTimesheet={handleSubmitTimesheet}
            onApproveTimesheet={handleApproveTimesheet}
            onRejectTimesheet={handleRejectTimesheet}
            onDeleteTimesheet={handleDeleteTimesheet}
          />
        )}
      </Card>

      {/* Timesheet Detail Dialog */}
      <TimesheetDetailDialog
        timesheet={selectedTimesheet}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Timesheet</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this timesheet. This will be visible to the employee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmReject}>
              Reject Timesheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
