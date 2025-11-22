'use client'

import { useState } from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type ShiftAssignment = {
  id: string
  role: string | null
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
}

type Shift = {
  id: string
  name: string
  startTime: string
  endTime: string
  location: {
    id: string
    name: string
  }
  assignments: ShiftAssignment[]
}

interface WeeklyCalendarProps {
  shifts: Shift[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onShiftClick: (shift: Shift) => void
  onCreateShift?: (date: Date, hour: number) => void
}

export function WeeklyCalendar({
  shifts,
  currentDate,
  onDateChange,
  onShiftClick,
  onCreateShift,
}: WeeklyCalendarProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }) // Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getShiftsForCell = (day: Date, hour: number) => {
    return shifts.filter((shift) => {
      const shiftStart = parseISO(shift.startTime)
      const shiftHour = shiftStart.getHours()
      return isSameDay(shiftStart, day) && shiftHour === hour
    })
  }

  const handlePreviousWeek = () => {
    onDateChange(addDays(currentDate, -7))
  }

  const handleNextWeek = () => {
    onDateChange(addDays(currentDate, 7))
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-4 text-lg font-semibold">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </h2>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-8 border-b bg-muted/50">
          <div className="p-2 text-xs font-medium text-center border-r">Time</div>
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                'p-2 text-center border-r last:border-r-0',
                isSameDay(day, new Date()) && 'bg-primary/10'
              )}
            >
              <div className="text-xs font-medium">{format(day, 'EEE')}</div>
              <div className="text-lg font-bold">{format(day, 'd')}</div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
              <div className="p-2 text-xs text-muted-foreground text-center border-r">
                {format(new Date().setHours(hour, 0), 'ha')}
              </div>
              {weekDays.map((day) => {
                const cellShifts = getShiftsForCell(day, hour)
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="p-1 border-r last:border-r-0 min-h-[80px] hover:bg-muted/50 cursor-pointer relative group"
                    onClick={() => onCreateShift?.(day, hour)}
                  >
                    {cellShifts.length > 0 ? (
                      <div className="space-y-1">
                        {cellShifts.map((shift) => (
                          <Card
                            key={shift.id}
                            className="p-2 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={(e) => {
                              e.stopPropagation()
                              onShiftClick(shift)
                            }}
                          >
                            <div className="text-xs font-medium truncate">
                              {shift.location.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(parseISO(shift.startTime), 'h:mm a')} -{' '}
                              {format(parseISO(shift.endTime), 'h:mm a')}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {shift.assignments.map((assignment) => (
                                <Badge
                                  key={assignment.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {assignment.user.firstName} {assignment.user.lastName.charAt(0)}.
                                </Badge>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-full">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
