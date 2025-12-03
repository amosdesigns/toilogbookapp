"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, FileText, Clock, User, ExternalLink } from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import Link from "next/link"
import { getLogsByLocation } from "@/lib/actions/log-actions"

interface LogEntry {
  id: string
  type: "INCIDENT" | "PATROL" | "VISITOR_CHECKIN" | "MAINTENANCE" | "WEATHER" | "OTHER" | "ON_DUTY_CHECKLIST"
  title: string
  description: string
  status: "LIVE" | "UPDATED" | "ARCHIVED" | "DRAFT"
  user: {
    firstName: string
    lastName: string
  }
  createdAt: Date
}

interface Location {
  id: string
  name: string
}

interface LocationLogbookViewerProps {
  locations: Location[]
}

const logTypeColors = {
  INCIDENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  PATROL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  VISITOR_CHECKIN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  MAINTENANCE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  WEATHER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  ON_DUTY_CHECKLIST: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
}

export function LocationLogbookViewer({ locations }: LocationLogbookViewerProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchLocationLogs = async (locationId: string) => {
    if (!locationId) return

    try {
      setIsLoading(true)
      const result = await getLogsByLocation(locationId, 20)
      if (result.ok) {
        setLogs(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationChange = (locationId: string) => {
    setSelectedLocationId(locationId)
    fetchLocationLogs(locationId)
  }

  const selectedLocation = locations.find(l => l.id === selectedLocationId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Logbook</CardTitle>
        <CardDescription>
          View logbook entries from a specific marina location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Selector */}
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedLocationId} onValueChange={handleLocationChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a location to view its logbook" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Loading logs...</p>
          </div>
        )}

        {/* Log Entries */}
        {!isLoading && selectedLocationId && (
          <>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No log entries found for {selectedLocation?.name}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">
                    Showing {logs.length} recent entries from {selectedLocation?.name}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/logs?locationId=${selectedLocationId}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View All
                    </Link>
                  </Button>
                </div>

                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={logTypeColors[log.type]}>
                            {log.type.replace('_', ' ')}
                          </Badge>
                          {log.status !== "LIVE" && (
                            <Badge variant="outline">{log.status}</Badge>
                          )}
                        </div>

                        <h4 className="font-medium mb-1">{log.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {log.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(log.createdAt)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.user.firstName} {log.user.lastName}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <Link href={`/admin/logs/${log.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !selectedLocationId && (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Select a location to view its logbook entries</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
