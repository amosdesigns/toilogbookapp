import { Shift, Location, User } from './index'

export interface ShiftWithDetails extends Shift {
  location: Location
  supervisor: User | null
}

export interface ShiftCalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: ShiftWithDetails
}

export interface ShiftCalendarFilters {
  locationIds: string[]
  supervisorIds: string[]
  dateRange?: {
    start: Date
    end: Date
  }
}

export type CalendarView = 'month' | 'week' | 'day' | 'agenda'
