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

export interface LogFilters {
  locationId?: string
  search?: string
  type?: string
  status?: string
  year?: string
  month?: string
}

interface LogFiltersHorizontalProps {
  filters: LogFilters
  onFiltersChange: (filters: LogFilters) => void
  locations: Array<{ id: string; name: string }>
}

const LOG_TYPES = [
  { value: "INCIDENT", label: "Incident" },
  { value: "PATROL", label: "Patrol" },
  { value: "VISITOR_CHECKIN", label: "Visitor Check-in" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "WEATHER", label: "Weather" },
  { value: "ON_DUTY_CHECKLIST", label: "On Duty Checklist" },
  { value: "OTHER", label: "Other" },
]

const LOG_STATUSES = [
  { value: "LIVE", label: "Live" },
  { value: "UPDATED", label: "Updated" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
]

const MONTHS = [
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
]

export function LogFiltersHorizontal({ filters, onFiltersChange, locations }: LogFiltersHorizontalProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const handleFilterChange = (key: keyof LogFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* First Row: Search and Clear */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search title or description..."
                  value={filters.search || ""}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="default"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Second Row: Dropdowns */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm">Location</Label>
              <Select
                value={filters.locationId || "all"}
                onValueChange={(value) =>
                  handleFilterChange("locationId", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm">Type</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) =>
                  handleFilterChange("type", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {LOG_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {LOG_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year" className="text-sm">Year</Label>
              <Select
                value={filters.year || "all"}
                onValueChange={(value) =>
                  handleFilterChange("year", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger id="year">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month */}
            <div className="space-y-2">
              <Label htmlFor="month" className="text-sm">Month</Label>
              <Select
                value={filters.month || "all"}
                onValueChange={(value) =>
                  handleFilterChange("month", value === "all" ? undefined : value)
                }
                disabled={!filters.year}
              >
                <SelectTrigger id="month">
                  <SelectValue placeholder={filters.year ? "All" : "Select year"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
