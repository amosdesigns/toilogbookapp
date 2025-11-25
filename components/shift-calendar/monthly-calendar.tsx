'use client'

import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  parseISO,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Shift } from '@/lib/types'

interface MonthlyCalendarProps {
  shifts: Shift[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onShiftClick: (shift: Shift) => void
  onDayClick?: (date: Date) => void
}

export function MonthlyCalendar({
  shifts,
  currentDate,
  onDateChange,
  onShiftClick,
  onDayClick,
}: MonthlyCalendarProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const dateFormat = 'EEEE'
  const days = []
  let day = startDate

  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }

  const getShiftsForDay = (day: Date) => {
    return shifts.filter((shift) => {
      const shiftStart = typeof shift.startTime === 'string'
        ? parseISO(shift.startTime)
        : new Date(shift.startTime)
      return isSameDay(shiftStart, day)
    })
  }

  const handlePreviousMonth = () => {
    onDateChange(addMonths(currentDate, -1))
  }

  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1))
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-4 text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayShifts = getShiftsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[120px] p-2 border-r border-b last:border-r-0',
                  !isCurrentMonth && 'bg-muted/20',
                  isToday && 'bg-primary/5',
                  'hover:bg-muted/50 cursor-pointer transition-colors'
                )}
                onClick={() => onDayClick?.(day)}
              >
                <div className={cn('text-sm font-medium mb-1', !isCurrentMonth && 'text-muted-foreground')}>
                  {format(day, 'd')}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[90px]">
                  {dayShifts.map((shift) => (
                    <Card
                      key={shift.id}
                      className="p-1.5 cursor-pointer hover:shadow-sm transition-shadow text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        onShiftClick(shift)
                      }}
                    >
                      <div className="font-medium truncate">{shift.location.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {format(
                          typeof shift.startTime === 'string'
                            ? parseISO(shift.startTime)
                            : new Date(shift.startTime),
                          'h:mm a'
                        )}
                      </div>
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {shift.assignments.slice(0, 2).map((assignment) => (
                          <Badge key={assignment.id} variant="secondary" className="text-xs px-1 py-0">
                            {assignment.user.firstName.charAt(0)}
                            {assignment.user.lastName.charAt(0)}
                          </Badge>
                        ))}
                        {shift.assignments.length > 2 && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            +{shift.assignments.length - 2}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
