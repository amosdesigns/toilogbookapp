"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X } from "lucide-react"

export interface TimesheetFilters {
  userId?: string
  status?: string
  weekStartDate?: string
}

interface TimesheetFiltersHorizontalProps {
  filters: TimesheetFilters
  onFiltersChange: (filters: TimesheetFilters) => void
  users: Array<{ id: string; firstName: string; lastName: string }>
}

const TIMESHEET_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
]

export function TimesheetFiltersHorizontal({
  filters,
  onFiltersChange,
  users,
}: TimesheetFiltersHorizontalProps) {
  const handleFilterChange = (key: keyof TimesheetFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  // Get recent weeks for quick selection
  const getRecentWeeks = () => {
    const weeks = []
    const today = new Date()

    for (let i = 0; i < 8; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - (i * 7))
      const day = date.getDay()
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - day)
      weekStart.setHours(0, 0, 0, 0)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      weeks.push({
        value: weekStart.toISOString().split('T')[0],
        label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      })
    }

    return weeks
  }

  const recentWeeks = getRecentWeeks()

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Employee */}
            <div className="space-y-2">
              <Label htmlFor="user" className="text-sm">Employee</Label>
              <Select
                value={filters.userId || "all"}
                onValueChange={(value) =>
                  handleFilterChange("userId", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger id="user">
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm">Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  handleFilterChange("status", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {TIMESHEET_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Week Start Date */}
            <div className="space-y-2">
              <Label htmlFor="week" className="text-sm">Week Period</Label>
              <Select
                value={filters.weekStartDate || "all"}
                onValueChange={(value) =>
                  handleFilterChange("weekStartDate", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger id="week">
                  <SelectValue placeholder="All weeks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All weeks</SelectItem>
                  {recentWeeks.map((week) => (
                    <SelectItem key={week.value} value={week.value}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Button */}
            <div className="space-y-2">
              <Label className="text-sm invisible">Clear</Label>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
