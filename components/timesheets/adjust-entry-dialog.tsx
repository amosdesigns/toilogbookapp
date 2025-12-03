"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "lucide-react"
import { type TimesheetEntryWithFullDetails } from "@/lib/types/prisma-types"

interface AdjustEntryDialogProps {
  entry: TimesheetEntryWithFullDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: {
    entryId: string
    clockInTime: string
    clockOutTime: string
    reason: string
  }) => void
}

export function AdjustEntryDialog({
  entry,
  open,
  onOpenChange,
  onConfirm,
}: AdjustEntryDialogProps) {
  const [clockInTime, setClockInTime] = useState("")
  const [clockOutTime, setClockOutTime] = useState("")
  const [reason, setReason] = useState("")

  // Initialize form when entry changes
  useEffect(() => {
    if (entry) {
      const formatDateTimeLocal = (date: Date) => {
        const d = new Date(date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }

      setClockInTime(formatDateTimeLocal(entry.clockInTime))
      setClockOutTime(formatDateTimeLocal(entry.clockOutTime))
      setReason("")
    }
  }, [entry])

  const handleConfirm = () => {
    if (!entry) return

    if (!reason.trim()) {
      alert("Please provide a reason for the adjustment")
      return
    }

    if (!clockInTime || !clockOutTime) {
      alert("Please provide both clock in and clock out times")
      return
    }

    onConfirm({
      entryId: entry.id,
      clockInTime,
      clockOutTime,
      reason: reason.trim(),
    })

    // Reset form
    setReason("")
    onOpenChange(false)
  }

  const handleCancel = () => {
    setReason("")
    onOpenChange(false)
  }

  if (!entry) return null

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
      year: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Adjust Timesheet Entry</DialogTitle>
          <DialogDescription>
            Edit the clock in/out times for this entry. A reason is required for audit purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Entry Info */}
          <div className="rounded-lg border p-3 bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatDate(entry.date)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {entry.location?.name || 'N/A'}
            </p>
          </div>

          {/* Original Times */}
          <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/30">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Original Clock In</p>
              <p className="font-medium">{formatTime(entry.clockInTime)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Original Clock Out</p>
              <p className="font-medium">{formatTime(entry.clockOutTime)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Original Hours</p>
              <p className="font-medium">{Number(entry.hoursWorked).toFixed(2)} hours</p>
            </div>
          </div>

          {/* New Times */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="clockIn">New Clock In Time</Label>
              <Input
                id="clockIn"
                type="datetime-local"
                value={clockInTime}
                onChange={(e) => setClockInTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clockOut">New Clock Out Time</Label>
              <Input
                id="clockOut"
                type="datetime-local"
                value={clockOutTime}
                onChange={(e) => setClockOutTime(e.target.value)}
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Adjustment Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why this adjustment is necessary..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This will be recorded in the audit trail
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Save Adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
