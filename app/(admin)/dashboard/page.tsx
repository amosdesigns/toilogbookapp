"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { DutyStatusCard } from "@/components/duty/duty-status-card"
import { ClockInDialog } from "@/components/duty/clock-in-dialog"
import { SupervisorClockInDialog } from "@/components/duty/supervisor-clock-in-dialog"
import { SupervisorClockOutDialog } from "@/components/duty/supervisor-clock-out-dialog"
import { SupervisorEquipmentStatusCard } from "@/components/duty/supervisor-equipment-status-card"
import { LocationCheckInDialog } from "@/components/duty/location-checkin-dialog"
import { IncidentReviewDialog } from "@/components/incidents/incident-review-dialog"
import { GuardsOnDutyTable } from "@/components/supervisor/guards-on-duty-table"
import { IncidentReportsStatus } from "@/components/supervisor/incident-reports-status"
import { LocationLogbookViewer } from "@/components/supervisor/location-logbook-viewer"
import { ActiveTourCard } from "@/components/tour/active-tour-card"
import { FileText, Calendar, MapPin, Users } from "lucide-react"
import { toast } from "sonner"
import { getActiveLocations, type ActiveLocationData } from "@/lib/actions/location-actions"
import { getActiveDutySession, clockIn, clockOut, createLocationCheckIn, checkoutFromLocation } from "@/lib/actions/duty-session-actions"
import { getGuardsOnDuty } from "@/lib/actions/guards-actions"
import { getIncidents, getTotalLogsCount } from "@/lib/actions/log-actions"
import { reviewIncident } from "@/lib/actions/incident-actions"
import { getTours } from "@/lib/actions/tour-actions"
import { getShifts } from "@/lib/actions/shift-actions"
import { checkoutEquipment, checkinEquipment, getEquipmentCheckouts } from "@/lib/actions/supervisor-equipment-actions"
import { getErrorMessage, type CatchError } from "@/lib/utils/error-handler"
import type { DutySession, GuardOnDuty, IncidentReport, UserRole } from "@/lib/types"
import type { TourWithSupervisor, DutySessionWithCheckIns } from "@/lib/types/prisma-types"
import type { SupervisorEquipmentCheckout, SupervisorEquipment } from "@prisma/client"

type EquipmentCheckoutWithEquipment = SupervisorEquipmentCheckout & {
  equipment: SupervisorEquipment
}

export default function AdminDashboardPage() {
  const { user } = useUser()
  const [dbUser, setDbUser] = useState<{ role: UserRole } | null>(null)
  const [dutySession, setDutySession] = useState<DutySessionWithCheckIns | null>(null)
  const [locations, setLocations] = useState<ActiveLocationData[]>([])
  const [guardsOnDuty, setGuardsOnDuty] = useState<GuardOnDuty[]>([])
  const [incidents, setIncidents] = useState<IncidentReport[]>([])
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null)
  const [activeTour, setActiveTour] = useState<TourWithSupervisor | null>(null)
  const [equipmentCheckouts, setEquipmentCheckouts] = useState<EquipmentCheckoutWithEquipment[]>([])

  // Stats data
  const [totalLogs, setTotalLogs] = useState(0)
  const [todayShifts, setTodayShifts] = useState(0)

  const [clockInDialogOpen, setClockInDialogOpen] = useState(false)
  const [supervisorClockInDialogOpen, setSupervisorClockInDialogOpen] = useState(false)
  const [supervisorClockOutDialogOpen, setSupervisorClockOutDialogOpen] = useState(false)
  const [locationCheckInDialogOpen, setLocationCheckInDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const userRole = dbUser?.role || "GUARD"
  const isSupervisor = userRole === "SUPERVISOR" || userRole === "ADMIN" || userRole === "SUPER_ADMIN"

  // Debug logging - shows on every render
  console.log('[DASHBOARD RENDER] Current component state:', {
    dbUser,
    userRole,
    isSupervisor,
    dutySessionExists: !!dutySession,
    equipmentCheckoutsLength: equipmentCheckouts.length,
    clerkUserId: user?.id,
    clerkEmail: user?.emailAddresses?.[0]?.emailAddress,
    timestamp: new Date().toISOString()
  })

  console.log('[DASHBOARD RENDER] Which dialog should open?', {
    shouldShowSupervisorWorkflow: isSupervisor,
    supervisorClockInDialogOpen,
    clockInDialogOpen
  })

  useEffect(() => {
    // Fetch user role from database first
    const fetchUser = async () => {
      console.log('========================================')
      console.log('[DASHBOARD] Starting user data fetch...')
      console.log('[DASHBOARD] Clerk user from useUser:', {
        id: user?.id,
        email: user?.emailAddresses?.[0]?.emailAddress,
        firstName: user?.firstName,
        lastName: user?.lastName,
        fullClerkUser: user
      })

      const userData = await getCurrentUser()

      console.log('[DASHBOARD] User data returned from DB:', {
        exists: !!userData,
        email: userData?.email,
        role: userData?.role,
        clerkId: userData?.clerkId,
        id: userData?.id,
        fullDbUser: userData
      })

      if (userData) {
        console.log('[DASHBOARD] ✅ Setting dbUser state with role:', userData.role)
        setDbUser({ role: userData.role as UserRole })
        console.log('[DASHBOARD] ✅ State update called')
      } else {
        console.log('[DASHBOARD] ❌ No user data returned from getCurrentUser()')
      }
      console.log('========================================')
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (dbUser) {
      fetchDashboardData()
    }
  }, [dbUser?.role])

  const fetchDashboardData = async () => {
    try {
      setIsFetching(true)

      // Fetch active duty session using server action
      const dutyResult = await getActiveDutySession()
      if (dutyResult.ok && dutyResult.data) {
        setDutySession(dutyResult.data)

        // If supervisor and has active duty, fetch equipment checkouts
        if (isSupervisor && dutyResult.data.id) {
          const equipmentResult = await getEquipmentCheckouts(dutyResult.data.id)
          if (equipmentResult.ok && equipmentResult.data) {
            setEquipmentCheckouts(equipmentResult.data)
          }
        }
      } else {
        setEquipmentCheckouts([])
      }

      // Fetch locations using server action
      const locationsResult = await getActiveLocations()
      if (locationsResult.ok && locationsResult.data) {
        setLocations(locationsResult.data)
      }

      // Fetch stats data
      const logsResult = await getTotalLogsCount()
      if (logsResult.ok && logsResult.data !== undefined) {
        setTotalLogs(logsResult.data)
      }

      // Fetch today's shifts
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const shiftsResult = await getShifts({
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
      })
      if (shiftsResult.ok && shiftsResult.data) {
        setTodayShifts(shiftsResult.data.length)
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

        // Fetch active tour (IN_PROGRESS status)
        const toursResult = await getTours({ status: "IN_PROGRESS" })
        if (toursResult.ok && toursResult.data && toursResult.data.length > 0) {
          setActiveTour(toursResult.data[0])
        } else {
          setActiveTour(null)
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

      // fetchDashboardData will get the full duty session with locationCheckIns
      toast.success("Successfully clocked in!")
      fetchDashboardData() // Refresh data to get full session details
    } catch (error: CatchError) {
      toast.error(getErrorMessage(error))
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleSupervisorClockIn = async (data: {
    carId: string
    radioId: string
    checkoutMileage: number
  }) => {
    try {
      setIsLoading(true)

      // Step 1: Clock in (creates duty session at HQ)
      const clockInResult = await clockIn({})

      if (!clockInResult.ok) {
        throw new Error(clockInResult.message || "Failed to clock in")
      }

      const newDutySession = clockInResult.data!

      // Step 2: Checkout equipment
      const equipmentResult = await checkoutEquipment({
        dutySessionId: newDutySession.id,
        carId: data.carId,
        radioId: data.radioId,
        checkoutMileage: data.checkoutMileage,
      })

      if (!equipmentResult.ok) {
        throw new Error(equipmentResult.message || "Failed to checkout equipment")
      }

      toast.success("Successfully clocked in and checked out equipment!")
      fetchDashboardData() // Refresh data to get full session details
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

  const handleSupervisorClockOut = async (data: { checkinMileage: number }) => {
    if (!dutySession) return

    try {
      setIsLoading(true)

      // Step 1: Return equipment
      const equipmentResult = await checkinEquipment({
        dutySessionId: dutySession.id,
        checkinMileage: data.checkinMileage,
      })

      if (!equipmentResult.ok) {
        throw new Error(equipmentResult.message || "Failed to return equipment")
      }

      // Step 2: Clock out
      const clockOutResult = await clockOut(dutySession.id)

      if (!clockOutResult.ok) {
        throw new Error(clockOutResult.message || "Failed to clock out")
      }

      setDutySession(null)
      setEquipmentCheckouts([])
      toast.success("Successfully returned equipment and signed off duty!")
      fetchDashboardData() // Refresh data
    } catch (error: CatchError) {
      toast.error(getErrorMessage(error))
      throw error
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
      fetchDashboardData() // Refresh to get updated check-ins
    } catch (error: CatchError) {
      toast.error(getErrorMessage(error))
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationCheckOut = async (checkInId: string) => {
    try {
      setIsLoading(true)
      const result = await checkoutFromLocation(checkInId)

      if (!result.ok) {
        throw new Error(result.message || "Failed to check out")
      }

      toast.success("Checked out from location!")
      fetchDashboardData() // Refresh to get updated check-ins
    } catch (error: CatchError) {
      toast.error(getErrorMessage(error))
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Welcome back, {user?.firstName}! Here's your overview.
        </p>
      </div>

      {/* Duty Management - Conditional based on role */}
      {isSupervisor && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Supervisor: Equipment Status Card or Clock In Card */}
          {dutySession && equipmentCheckouts.length > 0 ? (
            <SupervisorEquipmentStatusCard
              equipmentCheckouts={equipmentCheckouts}
              clockInTime={dutySession.clockInTime}
              onClockOut={() => {
                console.log('[DASHBOARD] Opening supervisor clock out dialog')
                setSupervisorClockOutDialogOpen(true)
              }}
            />
          ) : (
            <DutyStatusCard
              dutySession={dutySession}
              userRole={userRole}
              onClockIn={() => {
                console.log('[DASHBOARD] Clock in button clicked. Opening supervisor clock in dialog. Role:', userRole)
                setSupervisorClockInDialogOpen(true)
              }}
              onClockOut={handleClockOut}
            />
          )}

          {/* Location Check-In Card - Show when supervisor is on duty */}
          {dutySession && (() => {
            // Find the current active location check-in (no checkOutTime)
            const activeLocationCheckIn = dutySession.locationCheckIns?.find(
              (checkIn) => !checkIn.checkOutTime
            )

            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {activeLocationCheckIn ? "Current Location" : "Location Check-In"}
                  </CardTitle>
                  <CardDescription>
                    {activeLocationCheckIn
                      ? "You are currently checked in at this location"
                      : "Check in at locations during your rounds"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeLocationCheckIn ? (
                    <>
                      {/* Show current location and checkout button */}
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 mt-0.5 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium">{activeLocationCheckIn.location.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Checked in at {new Date(activeLocationCheckIn.checkInTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleLocationCheckOut(activeLocationCheckIn.id)}
                        variant="outline"
                        className="w-full"
                        disabled={isLoading}
                      >
                        Check Out from Location
                      </Button>
                    </>
                  ) : (
                    /* Show check-in button */
                    <Button
                      onClick={() => setLocationCheckInDialogOpen(true)}
                      className="w-full"
                      disabled={isLoading}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Check In at Location
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })()}
        </div>
      )}

      {/* Supervisor: Active Tour Card */}
      {isSupervisor && activeTour && (
        <ActiveTourCard tour={activeTour} locations={locations} guards={[]} />
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
      {isSupervisor && <LocationLogbookViewer locations={locations} />}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
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
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground">Active marinas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Shifts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayShifts}</div>
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
        isLoading={isLoading}
      />

      <SupervisorClockInDialog
        open={supervisorClockInDialogOpen}
        onOpenChange={setSupervisorClockInDialogOpen}
        onSubmit={handleSupervisorClockIn}
        isLoading={isLoading}
      />

      <SupervisorClockOutDialog
        open={supervisorClockOutDialogOpen}
        onOpenChange={setSupervisorClockOutDialogOpen}
        onSubmit={handleSupervisorClockOut}
        equipmentCheckouts={equipmentCheckouts}
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
  );
}
