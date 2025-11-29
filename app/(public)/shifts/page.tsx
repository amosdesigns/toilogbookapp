'use client'

import { useState, useEffect } from 'react'
import { format, addDays, isSameDay, parseISO, isToday } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCurrentUser } from '@/lib/actions/user-actions'
import { getShifts } from '@/lib/actions/shift-actions'
import { toast } from 'sonner'
import type { Shift, User } from '@/lib/types'

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Get current user
      const userResult = await getCurrentUser()
      if (userResult.ok && userResult.data) {
        setCurrentUser(userResult.data)
      } else {
        toast.error('Failed to load user data')
        return
      }

      // Fetch shifts for yesterday to next 7 days (9 days total)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 1)
      startDate.setHours(0, 0, 0, 0)

      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)
      endDate.setHours(23, 59, 59, 999)

      const shiftsResult = await getShifts({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      if (shiftsResult.ok && shiftsResult.data) {
        setShifts(shiftsResult.data)
      } else {
        toast.error('Failed to load shifts')
      }
    } catch (error) {
      console.error('Error fetching shifts:', error)
      toast.error('Failed to load shifts')
    } finally {
      setIsLoading(false)
    }
  }

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
    if (!currentUser) return false
    return shift.assignments.some((assignment) => assignment.user.id === currentUser.id)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading shifts...</p>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calendar className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">My Schedule</h1>
          <p className="text-sm text-muted-foreground">
            {currentUser?.firstName} {currentUser?.lastName}
          </p>
        </div>
      </div>

      {/* Mobile scrollable day view */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-3 min-w-max pb-2">
          {days.map((day, index) => {
            const dayShifts = getShiftsForDay(day)
            const isTodayDay = isToday(day)
            const isYesterday = index === 0

            return (
              <div key={day.toISOString()} className="w-[280px] flex-shrink-0">
                {/* Day header */}
                <div
                  className={cn(
                    'text-center p-3 rounded-lg border-2 mb-3',
                    isTodayDay && 'bg-primary/10 border-primary',
                    isYesterday && 'opacity-75',
                    !isTodayDay && !isYesterday && 'border-border'
                  )}
                >
                  <div className="text-xs font-medium text-muted-foreground uppercase">
                    {format(day, 'EEE')}
                  </div>
                  <div className="text-3xl font-bold">{format(day, 'd')}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(day, 'MMM yyyy')}
                  </div>
                  {isTodayDay && (
                    <Badge variant="default" className="mt-2">
                      TODAY
                    </Badge>
                  )}
                </div>

                {/* Shifts for this day */}
                <div className="space-y-3 min-h-[300px]">
                  {dayShifts.length === 0 ? (
                    <Card className="p-6 text-center border-dashed">
                      <p className="text-sm text-muted-foreground">No shifts</p>
                    </Card>
                  ) : (
                    dayShifts.map((shift) => {
                      const isMyShiftFlag = isMyShift(shift)
                      return (
                        <Card
                          key={shift.id}
                          className={cn(
                            'p-4 border-l-4 transition-all',
                            isMyShiftFlag
                              ? cn(
                                  'shadow-md',
                                  getMyShiftColor(shift.location.id)
                                )
                              : 'bg-muted/30 border-muted opacity-60'
                          )}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-base">
                                {shift.location.name}
                              </h3>
                              {isMyShiftFlag && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  ⭐ My Shift
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="font-medium">
                                {format(
                                  typeof shift.startTime === 'string'
                                    ? parseISO(shift.startTime)
                                    : new Date(shift.startTime),
                                  'h:mm a'
                                )}
                              </span>
                              <span>-</span>
                              <span className="font-medium">
                                {format(
                                  typeof shift.endTime === 'string'
                                    ? parseISO(shift.endTime)
                                    : new Date(shift.endTime),
                                  'h:mm a'
                                )}
                              </span>
                            </div>

                            {shift.assignments.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-2 border-t">
                                {shift.assignments.map((assignment) => (
                                  <Badge
                                    key={assignment.id}
                                    variant={
                                      assignment.user.id === currentUser?.id
                                        ? 'default'
                                        : 'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {assignment.user.firstName}{' '}
                                    {assignment.user.lastName.charAt(0)}.
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
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

      {/* Legend */}
      <Card className="p-4 mt-6">
        <h3 className="font-semibold text-sm mb-3">Legend</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 rounded"></div>
            <span>Your assigned shifts (highlighted)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted/30 border-2 border-muted rounded opacity-60"></div>
            <span>Other guards' shifts</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
