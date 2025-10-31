"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Clock, CheckCircle, FileText } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

interface IncidentReport {
  id: string
  title: string
  description: string
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  status: "LIVE" | "UPDATED" | "ARCHIVED" | "DRAFT"
  incidentTime: Date
  location: {
    name: string
  }
  user: {
    firstName: string
    lastName: string
  }
  reviewedBy?: string | null
  reviewedAt?: Date | null
  createdAt: Date
}

interface IncidentReportsStatusProps {
  incidents: IncidentReport[]
  onReviewClick: (incident: IncidentReport) => void
  onViewClick: (incident: IncidentReport) => void
}

const severityColors = {
  LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const statusIcons = {
  LIVE: Clock,
  UPDATED: AlertTriangle,
  ARCHIVED: CheckCircle,
  DRAFT: FileText,
}

const statusColors = {
  LIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  UPDATED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  ARCHIVED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  DRAFT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
}

export function IncidentReportsStatus({
  incidents,
  onReviewClick,
  onViewClick,
}: IncidentReportsStatusProps) {
  const [activeTab, setActiveTab] = useState("all")

  // Filter incidents by status
  const unreviewedIncidents = incidents.filter(i => !i.reviewedBy)
  const liveIncidents = incidents.filter(i => i.status === "LIVE")
  const updatedIncidents = incidents.filter(i => i.status === "UPDATED")
  const archivedIncidents = incidents.filter(i => i.status === "ARCHIVED")

  const getFilteredIncidents = () => {
    switch (activeTab) {
      case "unreviewed":
        return unreviewedIncidents
      case "live":
        return liveIncidents
      case "updated":
        return updatedIncidents
      case "archived":
        return archivedIncidents
      default:
        return incidents
    }
  }

  const filteredIncidents = getFilteredIncidents()

  const renderIncidentCard = (incident: IncidentReport) => {
    const StatusIcon = statusIcons[incident.status]
    const isUnreviewed = !incident.reviewedBy

    return (
      <div
        key={incident.id}
        className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={severityColors[incident.severity]}>
                {incident.severity}
              </Badge>
              <Badge className={statusColors[incident.status]}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {incident.status}
              </Badge>
              {isUnreviewed && (
                <Badge variant="outline" className="border-orange-500 text-orange-600">
                  Needs Review
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {incident.location.name}
              </span>
            </div>

            <h4 className="font-medium mb-1 truncate">{incident.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {incident.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Incident: {formatDateTime(incident.incidentTime)}
              </span>
              <span>•</span>
              <span>
                Reported by {incident.user.firstName} {incident.user.lastName}
              </span>
            </div>

            {incident.reviewedBy && incident.reviewedAt && (
              <div className="mt-2 text-xs text-muted-foreground">
                Reviewed on {formatDateTime(incident.reviewedAt)}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {isUnreviewed ? (
              <Button
                size="sm"
                onClick={() => onReviewClick(incident)}
              >
                Review
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewClick(incident)}
              >
                View
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Reports</CardTitle>
        <CardDescription>
          Monitor and review incident reports across all locations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all">
              All ({incidents.length})
            </TabsTrigger>
            <TabsTrigger value="unreviewed">
              Unreviewed ({unreviewedIncidents.length})
            </TabsTrigger>
            <TabsTrigger value="live">
              Live ({liveIncidents.length})
            </TabsTrigger>
            <TabsTrigger value="updated">
              Updated ({updatedIncidents.length})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived ({archivedIncidents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredIncidents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No incidents in this category</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIncidents.map(renderIncidentCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
