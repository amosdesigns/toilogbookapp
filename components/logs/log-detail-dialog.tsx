"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatDateTime } from "@/lib/utils"
import {
  MapPin,
  User,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  Users,
  Eye,
  Briefcase,
  CloudRain,
} from "lucide-react"

interface LogDetail {
  id: string
  type: string
  title: string
  description: string
  status: string
  createdAt: Date
  updatedAt: Date
  location: {
    name: string
    address: string | null
  }
  user: {
    firstName: string
    lastName: string
    email: string
  }
  shift?: {
    name: string
  } | null
  reviewer?: {
    firstName: string
    lastName: string
  } | null
  reviewedAt?: Date | null
  reviewNotes?: string | null
  severity?: string | null
  incidentTime?: Date | null
  peopleInvolved?: string | null
  witnesses?: string | null
  actionsTaken?: string | null
  followUpRequired?: boolean | null
  followUpNotes?: string | null
  weatherConditions?: string | null
}

interface LogDetailDialogProps {
  log: LogDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const logTypeColors: Record<string, string> = {
  INCIDENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  PATROL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  VISITOR_CHECKIN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  MAINTENANCE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  WEATHER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ON_DUTY_CHECKLIST: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

const statusColors: Record<string, string> = {
  LIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  UPDATED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  ARCHIVED: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
}

const severityColors: Record<string, string> = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-blue-500 text-white",
}

export function LogDetailDialog({ log, open, onOpenChange }: LogDetailDialogProps) {
  if (!log) return null

  const isIncident = log.type === "INCIDENT"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">{log.title}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={logTypeColors[log.type]}>
                  {log.type.replace(/_/g, " ")}
                </Badge>
                <Badge className={statusColors[log.status]}>
                  {log.status}
                </Badge>
                {log.severity && (
                  <Badge className={severityColors[log.severity]}>
                    {log.severity} SEVERITY
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Information */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap">{log.description}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="text-sm">{log.location.name}</p>
                  {log.location.address && (
                    <p className="text-xs text-muted-foreground">{log.location.address}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <p className="text-sm">
                    {log.user.firstName} {log.user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{log.user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p className="text-sm">{formatDateTime(log.createdAt)}</p>
                </div>
              </div>

              {log.shift && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Shift</p>
                    <p className="text-sm">{log.shift.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Incident-Specific Fields */}
          {isIncident && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Incident Details
                </h3>

                {log.incidentTime && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Incident Time
                      </p>
                      <p className="text-sm">{formatDateTime(log.incidentTime)}</p>
                    </div>
                  </div>
                )}

                {log.peopleInvolved && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        People Involved
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{log.peopleInvolved}</p>
                    </div>
                  </div>
                )}

                {log.witnesses && (
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Witnesses
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{log.witnesses}</p>
                    </div>
                  </div>
                )}

                {log.actionsTaken && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Actions Taken
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{log.actionsTaken}</p>
                    </div>
                  </div>
                )}

                {log.followUpRequired && (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                        Follow-up Required
                      </p>
                      {log.followUpNotes && (
                        <p className="text-sm whitespace-pre-wrap">{log.followUpNotes}</p>
                      )}
                    </div>
                  </div>
                )}

                {log.weatherConditions && (
                  <div className="flex items-start gap-3">
                    <CloudRain className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Weather Conditions
                      </p>
                      <p className="text-sm">{log.weatherConditions}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Review Information */}
          {log.reviewer && log.reviewedAt && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Review Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Reviewed By
                      </p>
                      <p className="text-sm">
                        {log.reviewer.firstName} {log.reviewer.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Reviewed At
                      </p>
                      <p className="text-sm">{formatDateTime(log.reviewedAt)}</p>
                    </div>
                  </div>
                </div>

                {log.reviewNotes && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Review Notes
                      </p>
                      <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                        {log.reviewNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
