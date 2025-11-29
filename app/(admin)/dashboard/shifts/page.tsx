'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, Repeat, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { WeeklyCalendar } from '@/components/shift-calendar/weekly-calendar'
import { MonthlyCalendar } from '@/components/shift-calendar/monthly-calendar'
import { MeFocusCalendar } from '@/components/shift-calendar/me-focus-calendar'
import { ShiftFormDialog } from '@/components/shift-calendar/shift-form-dialog'
import { RecurringPatternDialog } from '@/components/shift-calendar/recurring-pattern-dialog'
import { toast } from 'sonner'
import { getCurrentUser, getUsers } from '@/lib/actions/user-actions'
import { getActiveLocations } from '@/lib/actions/location-actions'
import { getShifts } from '@/lib/actions/shift-actions'
import { getErrorMessage, type CatchError } from '@/lib/utils/error-handler'
import type { Location, User, Shift } from '@/lib/types'

export default function ShiftsPage() {
  const { user: clerkUser, isLoaded } = useUser()
  const router = useRouter()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly' | 'me-focus'>('me-focus')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')

  const [shifts, setShifts] = useState<Shift[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false)
  const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [newShiftDate, setNewShiftDate] = useState<Date | null>(null)
  const [newShiftHour, setNewShiftHour] = useState<number | undefined>(undefined)

  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  // Check user permissions
  useEffect(() => {
    if (isLoaded && clerkUser) {
      checkAccess()
    }
  }, [isLoaded, clerkUser])

  const checkAccess = async () => {
    try {
      // Fetch current user from database to check role
      const result = await getCurrentUser()
      if (result.ok && result.data) {
        const user = result.data
        setCurrentUser(user)

        // Only Supervisor, Admin, and Super Admin can access
        const allowedRoles = ['SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']
        if (allowedRoles.includes(user.role)) {
          setHasAccess(true)
        } else {
          toast.error('You do not have permission to access this page')
          router.push('/dashboard')
        }
      } else {
        toast.error(result.message || 'Failed to load user data')
        router.push('/dashboard')
      }
    } catch (error: CatchError) {
      console.error('Error checking access:', error)
      toast.error(getErrorMessage(error))
      router.push('/dashboard')
    }
  }

  // Fetch initial data
  useEffect(() => {
    fetchData()
  }, [currentDate, selectedLocation, viewMode])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch locations
      const locationsResult = await getActiveLocations()
      if (locationsResult.ok && locationsResult.data) {
        setLocations(locationsResult.data)
      } else {
        toast.error(locationsResult.message || 'Failed to load locations')
      }

      // Fetch users
      const usersResult = await getUsers()
      if (usersResult.ok && usersResult.data) {
        setUsers(usersResult.data)
      } else {
        toast.error(usersResult.message || 'Failed to load users')
      }

      // Fetch shifts based on view mode
      let startDate: Date
      let endDate: Date

      if (viewMode === 'me-focus') {
        // Yesterday to next 7 days (9 days total)
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)

        endDate = new Date()
        endDate.setDate(endDate.getDate() + 7)
        endDate.setHours(23, 59, 59, 999)
      } else {
        // Monthly view - first and last day of month
        startDate = new Date(currentDate)
        startDate.setDate(1)
        endDate = new Date(currentDate)
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(0)
      }

      const shiftsResult = await getShifts({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        locationId: selectedLocation && selectedLocation !== 'all' ? selectedLocation : undefined,
      })

      if (shiftsResult.ok && shiftsResult.data) {
        setShifts(shiftsResult.data)
      } else {
        toast.error(shiftsResult.message || 'Failed to load shifts')
      }
    } catch (error: CatchError) {
      console.error('Error fetching data:', error)
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift)
    setIsShiftDialogOpen(true)
  }

  const handleCreateShift = (date?: Date, hour?: number) => {
    setSelectedShift(null)
    setNewShiftDate(date || null)
    setNewShiftHour(hour)
    setIsShiftDialogOpen(true)
  }

  const handleCreateRecurringPattern = () => {
    setIsRecurringDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsShiftDialogOpen(false)
    setIsRecurringDialogOpen(false)
    setSelectedShift(null)
    setNewShiftDate(null)
    setNewShiftHour(undefined)
  }

  const handleSuccess = () => {
    fetchData()
    handleDialogClose()
  }

  const filteredShifts =
    selectedLocation === 'all'
      ? shifts
      : shifts.filter((s) => s.location.id === selectedLocation)

  // Show loading or access denied
  if (!isLoaded || isLoading || !hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen">
        {!hasAccess && !isLoading ? (
          <div className="text-center space-y-4">
            <Lock className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">
              You do not have permission to access shift management.
            </p>
            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          </div>
        ) : (
          <p className="text-muted-foreground">Loading...</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shift Management</h1>
          <p className="text-muted-foreground">
            Manage shift schedules, assign guards, and create recurring patterns
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => handleCreateShift()} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Shift
          </Button>
          <Button onClick={handleCreateRecurringPattern} size="sm" variant="outline">
            <Repeat className="h-4 w-4 mr-2" />
            Recurring Pattern
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'weekly' | 'monthly' | 'me-focus')}>
            <TabsList>
              <TabsTrigger value="me-focus">
                <Calendar className="h-4 w-4 mr-2" />
                Me Focus
              </TabsTrigger>
              <TabsTrigger value="weekly">
                <Calendar className="h-4 w-4 mr-2" />
                Week
              </TabsTrigger>
              <TabsTrigger value="monthly">
                <Calendar className="h-4 w-4 mr-2" />
                Month
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-[600px]">
            <p className="text-muted-foreground">Loading shifts...</p>
          </div>
        ) : (
          <>
            {viewMode === 'me-focus' ? (
              <MeFocusCalendar
                shifts={filteredShifts}
                currentUserId={currentUser?.id || ''}
                onShiftClick={handleShiftClick}
              />
            ) : viewMode === 'weekly' ? (
              <WeeklyCalendar
                shifts={filteredShifts}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onShiftClick={handleShiftClick}
                onCreateShift={handleCreateShift}
              />
            ) : (
              <MonthlyCalendar
                shifts={filteredShifts}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onShiftClick={handleShiftClick}
                onDayClick={(date) => handleCreateShift(date)}
              />
            )}
          </>
        )}
      </Card>

      <ShiftFormDialog
        open={isShiftDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose()
          else setIsShiftDialogOpen(open)
        }}
        locations={locations}
        users={users}
        shift={selectedShift}
        defaultDate={newShiftDate || undefined}
        defaultHour={newShiftHour}
        onSuccess={handleSuccess}
      />

      <RecurringPatternDialog
        open={isRecurringDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose()
          else setIsRecurringDialogOpen(open)
        }}
        locations={locations}
        users={users}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
