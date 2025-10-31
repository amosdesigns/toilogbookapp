"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DutyStatusCard } from "@/components/duty/duty-status-card"
import { ClockInDialog } from "@/components/duty/clock-in-dialog"
import { LocationCheckInDialog } from "@/components/duty/location-checkin-dialog"
import { IncidentReviewDialog } from "@/components/incidents/incident-review-dialog"
import { GuardsOnDutyTable } from "@/components/supervisor/guards-on-duty-table"
import { IncidentReportsStatus } from "@/components/supervisor/incident-reports-status"
import { LocationLogbookViewer } from "@/components/supervisor/location-logbook-viewer"
import { FileText, Calendar, MapPin, Users } from "lucide-react"
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

interface IncidentReport {
  id: string
  title: string
  description: string
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  status: "LIVE" | "UPDATED" | "ARCHIVED" | "DRAFT"
  incidentTime: Date
  location: {
    name: string
  }
  user: {
    firstName: string
    lastName: string
  }
  peopleInvolved?: string
  witnesses?: string
  actionsTaken?: string
  followUpRequired?: boolean
  followUpNotes?: string
  reviewedBy?: string | null
  reviewedAt?: Date | null
  createdAt: Date
}

export default function AdminDashboardPage() {
  const { user } = useUser()
  const [dutySession, setDutySession] = useState<DutySession | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [guardsOnDuty, setGuardsOnDuty] = useState<GuardOnDuty[]>([])
  const [incidents, setIncidents] = useState<IncidentReport[]>([])
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null)

  const [clockInDialogOpen, setClockInDialogOpen] = useState(false)
  const [locationCheckInDialogOpen, setLocationCheckInDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const userRole = (user?.publicMetadata?.role as string) || "GUARD"
  const isSupervisor = userRole === "SUPERVISOR" || userRole === "ADMIN" || userRole === "SUPER_ADMIN"

  useEffect(() => {
    fetchDashboardData()
  }, [isSupervisor])

  const fetchDashboardData = async () => {
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

      // Fetch locations
      const locationsResponse = await fetch("/api/locations")
      if (locationsResponse.ok) {
        const data = await locationsResponse.json()
        setLocations(data.locations || [])
      }

      // Supervisor-only data
      if (isSupervisor) {
        // Fetch guards on duty
        const guardsResponse = await fetch("/api/guards-on-duty")
        if (guardsResponse.ok) {
          const data = await guardsResponse.json()
          setGuardsOnDuty(data.guards || [])
        }

        // Fetch all incidents
        const incidentsResponse = await fetch("/api/logs?type=INCIDENT")
        if (incidentsResponse.ok) {
          const data = await incidentsResponse.json()
          setIncidents(data.logs || [])
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setIsFetching(false)
    }
  }

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
      fetchDashboardData() // Refresh data
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
      fetchDashboardData() // Refresh data
    } catch (error: any) {
      toast.error(error.message || "Failed to clock out")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationCheckIn = async (data: { locationId: string; notes?: string }) => {
    if (!dutySession) return

    try {
      setIsLoading(true)
      const response = await fetch("/api/location-checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dutySessionId: dutySession.id,
          locationId: data.locationId,
          notes: data.notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to record check-in")
      }

      toast.success("Location check-in recorded!")
    } catch (error: any) {
      toast.error(error.message || "Failed to record check-in")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleIncidentReview = async (incidentId: string, data: { reviewNotes: string }) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/incidents/${incidentId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit review")
      }

      toast.success("Incident review submitted!")
      fetchDashboardData() // Refresh incidents
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const openIncidentReview = (incident: IncidentReport) => {
    setSelectedIncident(incident)
    setReviewDialogOpen(true)
  }

  const openIncidentView = (incident: IncidentReport) => {
    // In production, navigate to incident detail page
    toast.info("Viewing incident details (detail page not yet implemented)")
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.firstName}! Here's your overview.
        </p>
      </div>

      {/* Supervisor Duty Management */}
      {isSupervisor && (
        <div className="grid gap-4 md:grid-cols-2">
          <DutyStatusCard
            dutySession={dutySession}
            userRole={userRole as any}
            onClockIn={() => setClockInDialogOpen(true)}
            onClockOut={handleClockOut}
          />

          {/* Location Check-In Card */}
          {dutySession && !dutySession.locationId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Roaming Duty</CardTitle>
                <CardDescription>
                  Check in at locations during your rounds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <button
                  onClick={() => setLocationCheckInDialogOpen(true)}
                  className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Check In at Location
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Supervisor: Guards On Duty Table */}
      {isSupervisor && dutySession && (
        <Card>
          <CardHeader>
            <CardTitle>Guards Currently On Duty</CardTitle>
            <CardDescription>
              Monitor and manage all guards currently on active duty
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GuardsOnDutyTable
              guards={guardsOnDuty}
              onRefresh={fetchDashboardData}
            />
          </CardContent>
        </Card>
      )}

      {/* Supervisor: Incident Reports with Status Filtering */}
      {isSupervisor && (
        <IncidentReportsStatus
          incidents={incidents}
          onReviewClick={openIncidentReview}
          onViewClick={openIncidentView}
        />
      )}

      {/* Supervisor: Location Logbook Viewer */}
      {isSupervisor && (
        <LocationLogbookViewer locations={locations} />
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">11</div>
            <p className="text-xs text-muted-foreground">All time entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Guards</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guardsOnDuty.length}</div>
            <p className="text-xs text-muted-foreground">Currently on duty</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">11</div>
            <p className="text-xs text-muted-foreground">Marina locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Shifts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Scheduled today</p>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ClockInDialog
        open={clockInDialogOpen}
        onOpenChange={setClockInDialogOpen}
        onSubmit={handleClockIn}
        locations={locations}
        userRole={userRole as any}
        isLoading={isLoading}
      />

      <LocationCheckInDialog
        open={locationCheckInDialogOpen}
        onOpenChange={setLocationCheckInDialogOpen}
        onSubmit={handleLocationCheckIn}
        locations={locations}
        dutySessionId={dutySession?.id || ""}
        isLoading={isLoading}
      />

      <IncidentReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        incident={selectedIncident}
        onSubmit={handleIncidentReview}
        isLoading={isLoading}
      />
    </div>
  )
}
