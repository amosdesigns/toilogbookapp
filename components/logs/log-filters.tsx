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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, X } from "lucide-react"

export interface LogFilters {
  locationId?: string
  search?: string
  type?: string
  status?: string
  year?: string
  month?: string
}

interface LogFiltersProps {
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

export function LogFilters({ filters, onFiltersChange, locations }: LogFiltersProps) {
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
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
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

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Select
            value={filters.locationId || "all"}
            onValueChange={(value) =>
              handleFilterChange("locationId", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger id="location">
              <SelectValue placeholder="All locations" />
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
          <Label htmlFor="type">Type</Label>
          <Select
            value={filters.type || "all"}
            onValueChange={(value) =>
              handleFilterChange("type", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="All types" />
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
          <Label htmlFor="status">Status</Label>
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
          <Label htmlFor="year">Year</Label>
          <Select
            value={filters.year || "all"}
            onValueChange={(value) =>
              handleFilterChange("year", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger id="year">
              <SelectValue placeholder="All years" />
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
          <Label htmlFor="month">Month</Label>
          <Select
            value={filters.month || "all"}
            onValueChange={(value) =>
              handleFilterChange("month", value === "all" ? undefined : value)
            }
            disabled={!filters.year}
          >
            <SelectTrigger id="month">
              <SelectValue placeholder={filters.year ? "All months" : "Select year first"} />
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
      </CardContent>
    </Card>
  )
}
