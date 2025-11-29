'use client'

import { format, addDays, isSameDay, parseISO, isToday } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Shift } from '@/lib/types'

interface MeFocusCalendarProps {
  shifts: Shift[]
  currentUserId: string
  onShiftClick: (shift: Shift) => void
}

// Color coding for MY shifts
const getMyShiftColor = (locationId: string) => {
  const colors = [
    'bg-blue-100 border-blue-400 dark:bg-blue-900/50 dark:border-blue-600',
    'bg-green-100 border-green-400 dark:bg-green-900/50 dark:border-green-600',
    'bg-purple-100 border-purple-400 dark:bg-purple-900/50 dark:border-purple-600',
    'bg-orange-100 border-orange-400 dark:bg-orange-900/50 dark:border-orange-600',
    'bg-pink-100 border-pink-400 dark:bg-pink-900/50 dark:border-pink-600',
    'bg-cyan-100 border-cyan-400 dark:bg-cyan-900/50 dark:border-cyan-600',
    'bg-amber-100 border-amber-400 dark:bg-amber-900/50 dark:border-amber-600',
    'bg-indigo-100 border-indigo-400 dark:bg-indigo-900/50 dark:border-indigo-600',
  ]
  const hash = locationId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export function MeFocusCalendar({ shifts, currentUserId, onShiftClick }: MeFocusCalendarProps) {
  // Generate 9 days: yesterday, today, and next 7 days
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 1)

  const days = Array.from({ length: 9 }, (_, i) => addDays(startDate, i))

  const getShiftsForDay = (day: Date) => {
    return shifts.filter((shift) => {
      const shiftStart = typeof shift.startTime === 'string'
        ? parseISO(shift.startTime)
        : new Date(shift.startTime)
      return isSameDay(shiftStart, day)
    })
  }

  const isMyShift = (shift: Shift) => {
    return shift.assignments.some((assignment) => assignment.user.id === currentUserId)
  }

  return (
    <div className="space-y-4">
      {/* Day columns */}
      <div className="grid grid-cols-9 gap-2">
        {days.map((day, index) => {
          const dayShifts = getShiftsForDay(day)
          const isTodayDay = isToday(day)
          const isYesterday = index === 0

          return (
            <div key={day.toISOString()} className="space-y-2">
              {/* Day header */}
              <div
                className={cn(
                  'text-center p-3 rounded-lg border-2',
                  isTodayDay && 'bg-primary/10 border-primary font-semibold',
                  isYesterday && 'opacity-75',
                  !isTodayDay && !isYesterday && 'border-border'
                )}
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {format(day, 'EEE')}
                </div>
                <div className="text-2xl font-bold">{format(day, 'd')}</div>
                <div className="text-xs text-muted-foreground">
                  {format(day, 'MMM')}
                </div>
                {isTodayDay && (
                  <div className="text-xs font-semibold text-primary mt-1">TODAY</div>
                )}
              </div>

              {/* Shifts for this day */}
              <div className="space-y-2 min-h-[200px]">
                {dayShifts.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-4">
                    No shifts
                  </div>
                ) : (
                  dayShifts.map((shift) => {
                    const isMyShiftFlag = isMyShift(shift)
                    return (
                      <Card
                        key={shift.id}
                        className={cn(
                          'p-2 cursor-pointer transition-all border-l-4',
                          isMyShiftFlag
                            ? cn(
                                'hover:shadow-lg',
                                getMyShiftColor(shift.location.id)
                              )
                            : 'bg-muted/30 border-muted hover:bg-muted/50 opacity-60'
                        )}
                        onClick={() => onShiftClick(shift)}
                      >
                        <div className="text-xs font-semibold truncate">
                          {shift.location.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(
                            typeof shift.startTime === 'string'
                              ? parseISO(shift.startTime)
                              : new Date(shift.startTime),
                            'h:mm a'
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(
                            typeof shift.endTime === 'string'
                              ? parseISO(shift.endTime)
                              : new Date(shift.endTime),
                            'h:mm a'
                          )}
                        </div>
                        {isMyShiftFlag && (
                          <Badge variant="secondary" className="text-xs mt-2">
                            ⭐ My Shift
                          </Badge>
                        )}
                        {!isMyShiftFlag && shift.assignments.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {shift.assignments.slice(0, 2).map((assignment) => (
                              <Badge
                                key={assignment.id}
                                variant="outline"
                                className="text-xs px-1 py-0"
                              >
                                {assignment.user.firstName.charAt(0)}
                                {assignment.user.lastName.charAt(0)}
                              </Badge>
                            ))}
                            {shift.assignments.length > 2 && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                +{shift.assignments.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
