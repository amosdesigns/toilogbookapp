'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { addMonths, startOfMonth } from 'date-fns'
import { Plus, Calendar, Repeat, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { ShiftFormDialog } from '@/components/shift-calendar/shift-form-dialog'
import { RecurringPatternDialog } from '@/components/shift-calendar/recurring-pattern-dialog'
import { toast } from 'sonner'

type Location = {
  id: string
  name: string
  maxCapacity: number | null
}

type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

type ShiftAssignment = {
  id: string
  role: string | null
  user: User
}

type Shift = {
  id: string
  name: string
  startTime: string
  endTime: string
  location: Location
  assignments: ShiftAssignment[]
}

export default function ShiftsPage() {
  const { user: clerkUser, isLoaded } = useUser()
  const router = useRouter()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly')
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
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        const user = data.data
        setCurrentUser(user)

        // Only Supervisor, Admin, and Super Admin can access
        const allowedRoles = ['SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']
        if (allowedRoles.includes(user.role)) {
          setHasAccess(true)
        } else {
          toast.error('You do not have permission to access this page')
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Error checking access:', error)
      router.push('/dashboard')
    }
  }

  // Fetch initial data
  useEffect(() => {
    fetchData()
  }, [currentDate, selectedLocation])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch locations
      const locationsRes = await fetch('/api/locations')
      if (locationsRes.ok) {
        const locationsData = await locationsRes.json()
        setLocations(locationsData.data || [])
      }

      // Fetch users
      const usersRes = await fetch('/api/users')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.data || [])
      }

      // Fetch shifts
      const startDate = new Date(currentDate)
      startDate.setDate(1) // First day of month
      const endDate = new Date(currentDate)
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(0) // Last day of month

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      if (selectedLocation && selectedLocation !== 'all') {
        params.append('locationId', selectedLocation)
      }

      const shiftsRes = await fetch(`/api/shifts?${params}`)
      if (shiftsRes.ok) {
        const shiftsData = await shiftsRes.json()
        setShifts(shiftsData.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
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

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
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
            {viewMode === 'weekly' ? (
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
