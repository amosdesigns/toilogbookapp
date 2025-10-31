"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { DutyStatusCard } from "@/components/duty/duty-status-card"
import { ClockInDialog } from "@/components/duty/clock-in-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

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

interface Location {
  id: string
  name: string
}

export default function HomePage() {
  const { user } = useUser()
  const [dutySession, setDutySession] = useState<DutySession | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [clockInDialogOpen, setClockInDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const userRole = (user?.publicMetadata?.role as string) || "GUARD"

  // Fetch active duty session and locations on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setIsFetching(true)

        // Fetch active duty session
        const dutyResponse = await fetch("/api/duty-sessions?status=active")
        if (dutyResponse.ok) {
          const data = await dutyResponse.json()
          if (data.dutySession) {
            setDutySession(data.dutySession)
          }
        }

        // Fetch locations for clock-in
        const locationsResponse = await fetch("/api/locations")
        if (locationsResponse.ok) {
          const data = await locationsResponse.json()
          setLocations(data.locations || [])
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setIsFetching(false)
      }
    }

    fetchData()
  }, [])

  const handleClockIn = async (data: { locationId?: string; shiftId?: string }) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/duty-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to clock in")
      }

      const result = await response.json()
      setDutySession(result.dutySession)
      toast.success("Successfully clocked in!")
    } catch (error: any) {
      toast.error(error.message || "Failed to clock in")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleClockOut = async () => {
    if (!dutySession) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/duty-sessions/${dutySession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clockOut: true }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to clock out")
      }

      setDutySession(null)
      toast.success("Successfully signed off duty!")
    } catch (error: any) {
      toast.error(error.message || "Failed to clock out")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.firstName}!</h1>
        <p className="text-muted-foreground mt-1">
          {dutySession ? "You're currently on duty" : "Ready to start your shift?"}
        </p>
      </div>

      {/* Duty Status Card */}
      <DutyStatusCard
        dutySession={dutySession}
        userRole={userRole as any}
        onClockIn={() => setClockInDialogOpen(true)}
        onClockOut={handleClockOut}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/logs">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
            >
              <FileText className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">View Logs</p>
                <p className="text-sm text-muted-foreground">
                  See all log entries
                </p>
              </div>
            </Button>
          </Link>

          <Link href="/shifts">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
            >
              <Calendar className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">View Shifts</p>
                <p className="text-sm text-muted-foreground">
                  Check shift schedule
                </p>
              </div>
            </Button>
          </Link>

          {dutySession && (
            <Link href="/logs?action=create">
              <Button
                className="w-full justify-start h-auto py-4"
              >
                <AlertCircle className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Create Log Entry</p>
                  <p className="text-sm text-primary-foreground/80">
                    Report incident or activity
                  </p>
                </div>
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Clock In Dialog */}
      <ClockInDialog
        open={clockInDialogOpen}
        onOpenChange={setClockInDialogOpen}
        onSubmit={handleClockIn}
        locations={locations}
        userRole={userRole as any}
        isLoading={isLoading}
      />
    </div>
  )
}
