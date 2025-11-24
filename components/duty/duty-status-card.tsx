"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, AlertCircle } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

interface DutySession {
  id: string
  locationId: string | null
  clockInTime: Date
  clockOutTime: Date | null
  location?: {
    id: string
    name: string
  } | null
}

interface DutyStatusCardProps {
  dutySession: DutySession | null
  userRole: "GUARD" | "SUPERVISOR" | "ADMIN" | "SUPER_ADMIN"
  onClockIn: () => void
  onClockOut: () => void
}

export function DutyStatusCard({
  dutySession,
  userRole,
  onClockIn,
  onClockOut,
}: DutyStatusCardProps) {
  const isOnDuty = dutySession && !dutySession.clockOutTime
  const isRoaming = userRole !== "GUARD" && isOnDuty && !dutySession.locationId

  // Calculate time on duty
  const getTimeOnDuty = () => {
    if (!isOnDuty || !dutySession) return ""

    const now = new Date()
    const start = new Date(dutySession.clockInTime)
    const diff = now.getTime() - start.getTime()

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Current Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOnDuty && dutySession ? (
          <>
            {/* Time Info */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="font-medium">
                  {formatDateTime(dutySession.clockInTime)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Time on duty: <span className="font-medium">{getTimeOnDuty()}</span>
                </p>
              </div>
            </div>

            {/* Sign Off Button */}
            <Button
              onClick={onClockOut}
              variant="destructive"
              className="w-full"
            >
              Sign Off Duty
            </Button>
          </>
        ) : (
          <>
            {/* Not on duty */}
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  You are currently not on duty.
                  {userRole === "GUARD"
                    ? " Report for duty to start logging activities."
                    : " Start your roaming duty to begin supervisor rounds."}
                </p>
              </div>
            </div>

            {/* Clock In Button */}
            <Button
              onClick={onClockIn}
              className="w-full"
            >
              Report for Duty
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
