"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ShieldCheck, MapPin, Clock, ChevronRight, AlertCircle } from "lucide-react"
import { StartTourDialog } from "@/components/tour/start-tour-dialog"
import type { TourWithSupervisor } from "@/lib/types/prisma-types"
import type { ActiveLocationData } from "@/lib/actions/location-actions"
import type { TourStatus } from "@prisma/client"

interface User {
  id: string
  role: string
  firstName: string
  lastName: string
}

interface ToursListClientProps {
  user: User
  tours: TourWithSupervisor[]
  locations: ActiveLocationData[]
}

export function ToursListClient({ user, tours, locations }: ToursListClientProps) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState<TourStatus | "ALL">("ALL")

  // Filter tours by status
  const filteredTours = selectedStatus === "ALL"
    ? tours
    : tours.filter((tour) => tour.status === selectedStatus)

  // Count by status
  const statusCounts = {
    ALL: tours.length,
    IN_PROGRESS: tours.filter((t) => t.status === "IN_PROGRESS").length,
    COMPLETED: tours.filter((t) => t.status === "COMPLETED").length,
    CANCELLED: tours.filter((t) => t.status === "CANCELLED").length,
  }

  const getStatusBadge = (status: TourStatus) => {
    const variants: Record<TourStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      IN_PROGRESS: { variant: "default", label: "In Progress" },
      COMPLETED: { variant: "secondary", label: "Completed" },
      CANCELLED: { variant: "destructive", label: "Cancelled" },
      DRAFT: { variant: "outline", label: "Draft" },
    }
    const config = variants[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const calculateDuration = (tour: TourWithSupervisor) => {
    const start = new Date(tour.startedAt)
    const end = tour.completedAt ? new Date(tour.completedAt) : new Date()
    const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60))
    const minutes = Math.floor(((end.getTime() - start.getTime()) % (1000 * 60 * 60)) / (1000 * 60))

    if (tour.status === "IN_PROGRESS") {
      return `${hours}h ${minutes}m (ongoing)`
    }
    return `${hours}h ${minutes}m`
  }

  const hasActiveTour = tours.some((t) => t.status === "IN_PROGRESS")

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supervisor Tours</h1>
          <p className="text-muted-foreground mt-1">
            Track roaming tours, equipment checkout, and location inspections
          </p>
        </div>
        <StartTourDialog
          trigger={
            <Button size="lg" className="gap-2">
              <ShieldCheck className="h-5 w-5" />
              Start Tour
            </Button>
          }
        />
      </div>

      {/* Active tour warning */}
      {hasActiveTour && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <div className="flex-1">
              <p className="font-medium">Active Tour in Progress</p>
              <p className="text-sm text-muted-foreground">
                You have an active tour. Complete it before starting a new one.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const activeTour = tours.find((t) => t.status === "IN_PROGRESS")
                if (activeTour) {
                  router.push(`/dashboard/tours/${activeTour.id}`)
                }
              }}
            >
              View Active Tour
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Tabs */}
      <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as TourStatus | "ALL")}>
        <TabsList>
          <TabsTrigger value="ALL">All ({statusCounts.ALL})</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">Active ({statusCounts.IN_PROGRESS})</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed ({statusCounts.COMPLETED})</TabsTrigger>
          <TabsTrigger value="CANCELLED">Cancelled ({statusCounts.CANCELLED})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tours</CardTitle>
              <CardDescription>
                {filteredTours.length} tour{filteredTours.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTours.length === 0 ? (
                <div className="text-center py-12">
                  <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No tours found</p>
                  {selectedStatus === "ALL" && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Start your first tour to begin tracking inspections
                    </p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tour</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Equipment</TableHead>
                        <TableHead className="text-center">Stops</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTours.map((tour) => (
                        <TableRow key={tour.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {tour.title || `Tour #${tour.id.slice(0, 8)}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                by {tour.supervisor.firstName} {tour.supervisor.lastName}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(tour.status)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm">
                                {format(new Date(tour.startedAt), "MMM d, yyyy")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(tour.startedAt), "h:mm a")}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{calculateDuration(tour)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <p>Car: {tour.carNumber}</p>
                              <p>Radio: {tour.radioNumber}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">{tour.tourStops.length}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/dashboard/tours/${tour.id}`}>
                              <Button variant="ghost" size="sm" className="gap-1">
                                View
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
