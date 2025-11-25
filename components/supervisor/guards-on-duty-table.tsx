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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Edit, MapPin, Clock } from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { sendMessage as sendMessageAction } from "@/lib/actions/message-actions"
import { supervisorClockOut } from "@/lib/actions/duty-session-actions"
import { getErrorMessage, type CatchError } from "@/lib/utils/error-handler"

interface GuardOnDuty {
  userId: string
  userName: string
  userEmail: string
  role: string
  dutySessionId: string
  locationId: string | null
  locationName: string | null
  clockInTime: Date
  hoursOnDuty: string
}

interface GuardsOnDutyTableProps {
  guards: GuardOnDuty[]
  onRefresh: () => void
}

export function GuardsOnDutyTable({ guards, onRefresh }: GuardsOnDutyTableProps) {
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedGuard, setSelectedGuard] = useState<GuardOnDuty | null>(null)
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const openMessageDialog = (guard: GuardOnDuty) => {
    setSelectedGuard(guard)
    setMessage("")
    setMessageDialogOpen(true)
  }

  const openEditDialog = (guard: GuardOnDuty) => {
    setSelectedGuard(guard)
    setEditDialogOpen(true)
  }

  const sendMessage = async () => {
    if (!selectedGuard || !message.trim()) return

    try {
      setIsSending(true)
      const result = await sendMessageAction(selectedGuard.userId, message.trim())

      if (!result.success) {
        throw new Error(result.error || "Failed to send message")
      }

      toast.success(`Message sent to ${selectedGuard.userName}`)
      setMessageDialogOpen(false)
      setMessage("")
    } catch (error: CatchError) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSending(false)
    }
  }

  const endDutySession = async () => {
    if (!selectedGuard) return

    try {
      setIsSending(true)
      const result = await supervisorClockOut(selectedGuard.dutySessionId)

      if (!result.success) {
        throw new Error(result.error || "Failed to end duty session")
      }

      toast.success(`Duty session ended for ${selectedGuard.userName}`)
      setEditDialogOpen(false)
      onRefresh()
    } catch (error: CatchError) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSending(false)
    }
  }

  if (guards.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No guards currently on duty</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guard</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Clock In Time</TableHead>
              <TableHead>Hours On Duty</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guards.map((guard) => (
              <TableRow key={guard.dutySessionId}>
                <TableCell>
                  <div>
                    <p className="font-medium">{guard.userName}</p>
                    <p className="text-sm text-muted-foreground">{guard.userEmail}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {guard.locationName ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{guard.locationName}</span>
                    </div>
                  ) : (
                    <Badge variant="secondary">Roaming</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatDateTime(guard.clockInTime)}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{guard.hoursOnDuty}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openMessageDialog(guard)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(guard)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to {selectedGuard?.userName}</DialogTitle>
            <DialogDescription>
              Send a message to the guard while they're on duty
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px]"
                disabled={isSending}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setMessageDialogOpen(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                onClick={sendMessage}
                disabled={!message.trim() || isSending}
              >
                {isSending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Duty Session Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Duty Session</DialogTitle>
            <DialogDescription>
              Manage {selectedGuard?.userName}'s duty session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Guard:</span>
                <span className="font-medium">{selectedGuard?.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Location:</span>
                <span className="font-medium">
                  {selectedGuard?.locationName || "Roaming"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Time On Duty:</span>
                <span className="font-medium">{selectedGuard?.hoursOnDuty}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                As a supervisor, you can end this duty session on behalf of the guard.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={endDutySession}
                disabled={isSending}
              >
                {isSending ? "Ending..." : "End Duty Session"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
