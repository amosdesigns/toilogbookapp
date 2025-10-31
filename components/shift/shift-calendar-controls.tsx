"use client"

import { useState } from "react"
import { CalendarView, ShiftCalendarFilters } from "@/types/shift-calendar"
import { Location, User } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar, ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface ShiftCalendarControlsProps {
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  currentDate: Date
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void
  filters: ShiftCalendarFilters
  onFiltersChange: (filters: ShiftCalendarFilters) => void
  locations: Location[]
  supervisors: User[]
  onCreateShift?: () => void
  canCreateShift: boolean
}

export function ShiftCalendarControls({
  view,
  onViewChange,
  currentDate,
  onNavigate,
  filters,
  onFiltersChange,
  locations,
  supervisors,
  onCreateShift,
  canCreateShift,
}: ShiftCalendarControlsProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const handleLocationToggle = (locationId: string, checked: boolean) => {
    const newLocationIds = checked
      ? [...filters.locationIds, locationId]
      : filters.locationIds.filter((id) => id !== locationId)

    onFiltersChange({ ...filters, locationIds: newLocationIds })
  }

  const handleSupervisorToggle = (supervisorId: string, checked: boolean) => {
    const newSupervisorIds = checked
      ? [...filters.supervisorIds, supervisorId]
      : filters.supervisorIds.filter((id) => id !== supervisorId)

    onFiltersChange({ ...filters, supervisorIds: newSupervisorIds })
  }

  const clearFilters = () => {
    onFiltersChange({ locationIds: [], supervisorIds: [] })
  }

  const activeFilterCount = filters.locationIds.length + filters.supervisorIds.length

  const getDateLabel = () => {
    const options: Intl.DateTimeFormatOptions =
      view === 'month'
        ? { month: 'long', year: 'numeric' }
        : view === 'week'
        ? { month: 'short', day: 'numeric', year: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' }

    return currentDate.toLocaleDateString('en-US', options)
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Navigation and Date */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('PREV')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          onClick={() => onNavigate('TODAY')}
          className="min-w-[140px]"
        >
          <Calendar className="h-4 w-4 mr-2" />
          {getDateLabel()}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('NEXT')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* View Selector, Filters, and Actions */}
      <div className="flex items-center gap-2">
        {/* View Selector */}
        <Select value={view} onValueChange={(value) => onViewChange(value as CalendarView)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="agenda">Agenda</SelectItem>
          </SelectContent>
        </Select>

        {/* Filters */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filters</h4>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                <Separator />
              </div>

              {/* Location Filters */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Locations</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {locations.map((location) => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`location-${location.id}`}
                        checked={filters.locationIds.includes(location.id)}
                        onCheckedChange={(checked) =>
                          handleLocationToggle(location.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`location-${location.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {location.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Supervisor Filters */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Supervisors</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {supervisors.map((supervisor) => (
                    <div key={supervisor.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`supervisor-${supervisor.id}`}
                        checked={filters.supervisorIds.includes(supervisor.id)}
                        onCheckedChange={(checked) =>
                          handleSupervisorToggle(supervisor.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`supervisor-${supervisor.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {supervisor.firstName} {supervisor.lastName}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Create Shift Button */}
        {canCreateShift && onCreateShift && (
          <Button onClick={onCreateShift}>
            <Plus className="h-4 w-4 mr-2" />
            Create Shift
          </Button>
        )}
      </div>
    </div>
  )
}
