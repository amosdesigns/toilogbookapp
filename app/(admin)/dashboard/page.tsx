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
import { getActiveLocations } from "@/lib/actions/location-actions"
import { getActiveDutySession, clockIn, clockOut, createLocationCheckIn } from "@/lib/actions/duty-session-actions"
import { getGuardsOnDuty } from "@/lib/actions/guards-actions"
import { getIncidents } from "@/lib/actions/log-actions"
import { reviewIncident } from "@/lib/actions/incident-actions"
import { getErrorMessage, type CatchError } from "@/lib/utils/error-handler"
import type { DutySession, Location, GuardOnDuty, IncidentReport, UserRole } from "@/lib/types"

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

  const userRole = (user?.publicMetadata?.role as UserRole) || "GUARD"
  const isSupervisor = userRole === "SUPERVISOR" || userRole === "ADMIN" || userRole === "SUPER_ADMIN"

  useEffect(() => {
    fetchDashboardData()
  }, [isSupervisor])

  const fetchDashboardData = async () => {
    try {
      setIsFetching(true)

      // Fetch active duty session using server action
      const dutyResult = await getActiveDutySession()
      if (dutyResult.ok && dutyResult.data) {
        setDutySession(dutyResult.data)
      }

      // Fetch locations using server action
      const locationsResult = await getActiveLocations()
      if (locationsResult.ok && locationsResult.data) {
        setLocations(locationsResult.data)
      }

      // Supervisor-only data
      if (isSupervisor) {
        // Fetch guards on duty using server action
        const guardsResult = await getGuardsOnDuty()
        if (guardsResult.ok && guardsResult.data) {
          setGuardsOnDuty(guardsResult.data)
        }

        // Fetch all incidents using server action
        const incidentsResult = await getIncidents()
        if (incidentsResult.ok && incidentsResult.data) {
          setIncidents(incidentsResult.data)
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
      const result = await clockIn(data)

      if (!result.ok) {
        throw new Error(result.message || "Failed to clock in")
      }

      setDutySession(result.data!)
      toast.success("Successfully clocked in!")
      fetchDashboardData() // Refresh data
    } catch (error: CatchError) {
      toast.error(getErrorMessage(error))
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleClockOut = async () => {
    if (!dutySession) return

    try {
      setIsLoading(true)
      const result = await clockOut(dutySession.id)

      if (!result.ok) {
        throw new Error(result.message || "Failed to clock out")
      }

      setDutySession(null)
      toast.success("Successfully signed off duty!")
      fetchDashboardData() // Refresh data
    } catch (error: CatchError) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationCheckIn = async (data: { locationId: string; notes?: string }) => {
    if (!dutySession) return

    try {
      setIsLoading(true)
      const result = await createLocationCheckIn(
        dutySession.id,
        data.locationId,
        data.notes
      )

      if (!result.ok) {
        throw new Error(result.message || "Failed to record check-in")
      }

      toast.success("Location check-in recorded!")
    } catch (error: CatchError) {
      toast.error(getErrorMessage(error))
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleIncidentReview = async (incidentId: string, data: { reviewNotes: string }) => {
    try {
      setIsLoading(true)
      const result = await reviewIncident(incidentId, data.reviewNotes)

      if (!result.ok) {
        throw new Error(result.message || "Failed to submit review")
      }

      toast.success("Incident review submitted!")
      fetchDashboardData() // Refresh incidents
    } catch (error: CatchError) {
      toast.error(getErrorMessage(error))
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
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Welcome back, {user?.firstName}! Here's your overview.
        </p>
      </div>

      {/* Supervisor Duty Management */}
      {isSupervisor && (
        <div className="grid gap-4 md:grid-cols-2">
          <DutyStatusCard
            dutySession={dutySession}
            userRole={userRole}
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
        userRole={userRole}
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
