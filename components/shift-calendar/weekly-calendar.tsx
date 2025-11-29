'use client'

import { useState } from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Shift } from '@/lib/types'

interface WeeklyCalendarProps {
  shifts: Shift[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onShiftClick: (shift: Shift) => void
  onCreateShift?: (date: Date, hour: number) => void
}

// Color coding for shift cards based on location ID
const getShiftColor = (locationId: string) => {
  const colors = [
    'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700',
    'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700',
    'bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700',
    'bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-700',
    'bg-pink-100 border-pink-300 dark:bg-pink-900/30 dark:border-pink-700',
    'bg-cyan-100 border-cyan-300 dark:bg-cyan-900/30 dark:border-cyan-700',
    'bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700',
    'bg-indigo-100 border-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-700',
  ]
  // Use a simple hash to pick consistent color for each location
  const hash = locationId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
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

  const getShiftsForDay = (day: Date) => {
    return shifts.filter((shift) => {
      const shiftStart = typeof shift.startTime === 'string'
        ? parseISO(shift.startTime)
        : new Date(shift.startTime)
      return isSameDay(shiftStart, day)
    })
  }

  const calculateShiftPosition = (shift: Shift) => {
    const start = typeof shift.startTime === 'string' ? parseISO(shift.startTime) : new Date(shift.startTime)
    const end = typeof shift.endTime === 'string' ? parseISO(shift.endTime) : new Date(shift.endTime)

    const startHour = start.getHours()
    const startMinute = start.getMinutes()
    const endHour = end.getHours()
    const endMinute = end.getMinutes()

    const topOffset = ((startHour + startMinute / 60) * 80) // 80px per hour
    const duration = (endHour - startHour) + (endMinute - startMinute) / 60
    const height = duration * 80 // 80px per hour

    return { top: topOffset, height: Math.max(height, 40) } // Min height 40px
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

        {/* Time slots grid with absolute positioned shifts */}
        <div className="relative max-h-[600px] overflow-y-auto">
          {/* Time labels and grid lines */}
          <div className="grid grid-cols-8">
            {/* Time column */}
            <div className="relative">
              {hours.map((hour) => {
                const timeDate = new Date(2000, 0, 1, hour, 0)
                return (
                  <div
                    key={hour}
                    className="h-20 p-2 text-xs text-muted-foreground text-center border-b border-r"
                  >
                    {format(timeDate, 'h a')}
                  </div>
                )
              })}
            </div>

            {/* Day columns */}
            {weekDays.map((day) => {
              const dayShifts = getShiftsForDay(day)
              return (
                <div key={day.toISOString()} className="relative border-r last:border-r-0">
                  {/* Grid lines for hours */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="h-20 border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => onCreateShift?.(day, hour)}
                    />
                  ))}

                  {/* Absolute positioned shifts */}
                  {dayShifts.map((shift) => {
                    const { top, height } = calculateShiftPosition(shift)
                    return (
                      <Card
                        key={shift.id}
                        className={cn(
                          "absolute left-1 right-1 p-2 cursor-pointer hover:shadow-md transition-shadow border-l-4 z-10",
                          getShiftColor(shift.location.id)
                        )}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onShiftClick(shift)
                        }}
                      >
                        <div className="text-xs font-medium truncate">
                          {shift.location.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(
                            typeof shift.startTime === 'string'
                              ? parseISO(shift.startTime)
                              : new Date(shift.startTime),
                            'h:mm a'
                          )} -{' '}
                          {format(
                            typeof shift.endTime === 'string'
                              ? parseISO(shift.endTime)
                              : new Date(shift.endTime),
                            'h:mm a'
                          )}
                        </div>
                        {height > 60 && (
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
                        )}
                      </Card>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
