"use client"

import { useState, useMemo, useCallback } from "react"
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { ShiftCalendarEvent, ShiftCalendarFilters, CalendarView, ShiftWithDetails } from "@/types/shift-calendar"
import { Location, User, Role } from "@/types"
import { ShiftCalendarControls } from "./shift-calendar-controls"
import { ShiftCard } from "./shift-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { canManageShifts } from "@/lib/utils/auth"
import { Badge } from "@/components/ui/badge"

// Setup the localizer for react-big-calendar
const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface ShiftCalendarProps {
  shifts: ShiftWithDetails[]
  locations: Location[]
  supervisors: User[]
  userRole: Role
  userId: string
  onCreateShift?: () => void
  onEditShift?: (shift: ShiftWithDetails) => void
  onDeleteShift?: (shiftId: string) => void
}

export function ShiftCalendar({
  shifts,
  locations,
  supervisors,
  userRole,
  userId,
  onCreateShift,
  onEditShift,
  onDeleteShift,
}: ShiftCalendarProps) {
  const [view, setView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedShift, setSelectedShift] = useState<ShiftWithDetails | null>(null)
  const [filters, setFilters] = useState<ShiftCalendarFilters>({
    locationIds: [],
    supervisorIds: [],
  })

  const canCreate = canManageShifts(userRole)

  // Filter and convert shifts to calendar events
  const events = useMemo(() => {
    let filteredShifts = shifts

    // Apply location filter
    if (filters.locationIds.length > 0) {
      filteredShifts = filteredShifts.filter((shift) =>
        filters.locationIds.includes(shift.locationId)
      )
    }

    // Apply supervisor filter
    if (filters.supervisorIds.length > 0) {
      filteredShifts = filteredShifts.filter((shift) =>
        shift.supervisorId && filters.supervisorIds.includes(shift.supervisorId)
      )
    }

    // Convert to calendar events
    return filteredShifts.map((shift): ShiftCalendarEvent => ({
      id: shift.id,
      title: `${shift.name} - ${shift.location.name}`,
      start: new Date(shift.startTime),
      end: new Date(shift.endTime),
      resource: shift,
    }))
  }, [shifts, filters])

  const handleNavigate = useCallback((action: 'PREV' | 'NEXT' | 'TODAY') => {
    const newDate = new Date(currentDate)

    switch (action) {
      case 'PREV':
        if (view === 'month') {
          newDate.setMonth(newDate.getMonth() - 1)
        } else if (view === 'week') {
          newDate.setDate(newDate.getDate() - 7)
        } else {
          newDate.setDate(newDate.getDate() - 1)
        }
        break
      case 'NEXT':
        if (view === 'month') {
          newDate.setMonth(newDate.getMonth() + 1)
        } else if (view === 'week') {
          newDate.setDate(newDate.getDate() + 7)
        } else {
          newDate.setDate(newDate.getDate() + 1)
        }
        break
      case 'TODAY':
        setCurrentDate(new Date())
        return
    }

    setCurrentDate(newDate)
  }, [currentDate, view])

  const handleSelectEvent = useCallback((event: ShiftCalendarEvent) => {
    setSelectedShift(event.resource)
  }, [])

  const eventStyleGetter = useCallback((event: ShiftCalendarEvent) => {
    const shift = event.resource

    // Color code by location (you can customize this)
    const locationIndex = locations.findIndex((loc) => loc.id === shift.locationId)
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#f97316', // orange
      '#6366f1', // indigo
      '#14b8a6', // teal
    ]

    const backgroundColor = colors[locationIndex % colors.length]

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    }
  }, [locations])

  return (
    <div className="space-y-4">
      <ShiftCalendarControls
        view={view}
        onViewChange={setView}
        currentDate={currentDate}
        onNavigate={handleNavigate}
        filters={filters}
        onFiltersChange={setFilters}
        locations={locations}
        supervisors={supervisors}
        onCreateShift={onCreateShift}
        canCreateShift={canCreate}
      />

      {/* Active Filters Display */}
      {(filters.locationIds.length > 0 || filters.supervisorIds.length > 0) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.locationIds.map((locationId) => {
            const location = locations.find((loc) => loc.id === locationId)
            return location ? (
              <Badge key={locationId} variant="secondary">
                {location.name}
              </Badge>
            ) : null
          })}
          {filters.supervisorIds.map((supervisorId) => {
            const supervisor = supervisors.find((sup) => sup.id === supervisorId)
            return supervisor ? (
              <Badge key={supervisorId} variant="secondary">
                {supervisor.firstName} {supervisor.lastName}
              </Badge>
            ) : null
          })}
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-950 rounded-lg border p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={view as View}
          onView={(newView) => setView(newView as CalendarView)}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          popup
          views={['month', 'week', 'day', 'agenda']}
        />
      </div>

      {/* Shift Details Dialog */}
      <Dialog open={!!selectedShift} onOpenChange={() => setSelectedShift(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shift Details</DialogTitle>
          </DialogHeader>
          {selectedShift && (
            <ShiftCard
              shift={selectedShift}
              userRole={userRole}
              userId={userId}
              onEdit={onEditShift}
              onDelete={onDeleteShift}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
