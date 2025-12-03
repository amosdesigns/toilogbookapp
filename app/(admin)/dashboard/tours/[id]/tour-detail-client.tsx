"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Car,
  Radio,
  Key,
  MapPin,
  Clock,
  MapPinPlus,
  CheckCircle2,
  AlertCircle,
  User,
  FileText,
  Calendar,
  Shield,
  XCircle
} from "lucide-react"
import { CompleteTourDialog } from "@/components/tour/complete-tour-dialog"
import { TourStopDialog } from "@/components/tour/tour-stop-dialog"
import { cancelTour } from "@/lib/actions/tour-actions"
import { toast } from "sonner"
import type { TourWithFullRelations } from "@/lib/types/prisma-types"
import type { TourStatus, TourStopType } from "@prisma/client"

interface User {
  id: string
  role: string
  firstName: string
  lastName: string
}

interface Location {
  id: string
  name: string
}

interface Guard {
  id: string
  firstName: string
  lastName: string
}

interface TourDetailClientProps {
  user: User
  tour: TourWithFullRelations
  locations: Location[]
  guards: Guard[]
}

export function TourDetailClient({ user, tour, locations, guards }: TourDetailClientProps) {
  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)

  const isInProgress = tour.status === "IN_PROGRESS"
  const isCompleted = tour.status === "COMPLETED"
  const isCancelled = tour.status === "CANCELLED"

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

  const getStopTypeBadge = (stopType: TourStopType) => {
    const variants: Record<TourStopType, { label: string }> = {
      LOCATION_INSPECTION: { label: "Inspection" },
      GUARD_EVALUATION: { label: "Guard Eval" },
      INCIDENT_CHECK: { label: "Incident" },
      GENERAL_OBSERVATION: { label: "Observation" },
    }
    return <Badge variant="outline">{variants[stopType].label}</Badge>
  }

  const calculateDuration = () => {
    const start = new Date(tour.startedAt)
    const end = tour.completedAt ? new Date(tour.completedAt) : new Date()
    const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60))
    const minutes = Math.floor(((end.getTime() - start.getTime()) % (1000 * 60 * 60)) / (1000 * 60))

    if (isInProgress) {
      return `${hours}h ${minutes}m (ongoing)`
    }
    return `${hours}h ${minutes}m`
  }

  const mileageDriven = tour.endingMileage
    ? tour.endingMileage - tour.startingMileage
    : 0

  const visitedLocations = tour.tourStops
    .filter((stop) => stop.location)
    .map((stop) => stop.location!.name)

  const uniqueLocations = Array.from(new Set(visitedLocations))

  const handleCancelTour = async () => {
    if (!confirm("Are you sure you want to cancel this tour? This action cannot be undone.")) {
      return
    }

    setIsCancelling(true)
    const result = await cancelTour(tour.id, "Cancelled by supervisor")

    if (!result.ok) {
      toast.error(result.message)
      setIsCancelling(false)
      return
    }

    toast.success(result.message || "Tour cancelled successfully")
    router.push("/dashboard/tours")
    router.refresh()
  }

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link href="/dashboard/tours">
            <Button variant="ghost" size="sm" className="gap-1 mb-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Tours
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">
              {tour.title || `Tour #${tour.id.slice(0, 8)}`}
            </h1>
            {getStatusBadge(tour.status)}
          </div>
          <p className="text-muted-foreground">
            Started {formatDistanceToNow(new Date(tour.startedAt), { addSuffix: true })} by{" "}
            {tour.supervisor.firstName} {tour.supervisor.lastName}
          </p>
        </div>

        {isInProgress && (
          <div className="flex gap-2">
            <TourStopDialog
              tourId={tour.id}
              locations={locations}
              guards={guards}
              onSuccess={handleSuccess}
              trigger={
                <Button variant="outline" className="gap-2">
                  <MapPinPlus className="h-4 w-4" />
                  Add Stop
                </Button>
              }
            />
            <CompleteTourDialog
              tourId={tour.id}
              startingMileage={tour.startingMileage}
              carNumber={tour.carNumber}
              radioNumber={tour.radioNumber}
              startedAt={new Date(tour.startedAt)}
              totalStops={tour.tourStops.length}
              locations={uniqueLocations}
              trigger={
                <Button className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Complete Tour
                </Button>
              }
            />
            <Button
              variant="destructive"
              onClick={handleCancelTour}
              disabled={isCancelling}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              {isCancelling ? "Cancelling..." : "Cancel Tour"}
            </Button>
          </div>
        )}
      </div>

      {/* Tour Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Time & Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{calculateDuration()}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {tour.tourStops.length} stop{tour.tourStops.length !== 1 ? "s" : ""} recorded
            </p>
          </CardContent>
        </Card>

        {/* Locations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Locations Visited
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{uniqueLocations.length}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {uniqueLocations.slice(0, 2).join(", ")}
              {uniqueLocations.length > 2 && ` +${uniqueLocations.length - 2} more`}
            </p>
          </CardContent>
        </Card>

        {/* Mileage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              Mileage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {mileageDriven > 0 ? mileageDriven.toLocaleString() : "—"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isCompleted ? "miles driven" : "pending completion"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment & Vehicle</CardTitle>
          <CardDescription>Checkout and return tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Car */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Car className="h-4 w-4 text-muted-foreground" />
                Vehicle
              </div>
              <div className="rounded-md border p-3 space-y-2">
                <p className="font-medium">{tour.carNumber}</p>
                {isCompleted && (
                  <div className="flex items-center gap-1.5 text-sm">
                    {tour.carReturned ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-600">Returned</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-amber-600">Not Returned</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Radio */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Radio className="h-4 w-4 text-muted-foreground" />
                Radio
              </div>
              <div className="rounded-md border p-3 space-y-2">
                <p className="font-medium">{tour.radioNumber}</p>
                {isCompleted && (
                  <div className="flex items-center gap-1.5 text-sm">
                    {tour.radioReturned ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-600">Returned</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-amber-600">Not Returned</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Keys */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Key className="h-4 w-4 text-muted-foreground" />
                Keys
              </div>
              <div className="rounded-md border p-3 space-y-2">
                <p className="font-medium">Vehicle Keys</p>
                {isCompleted && (
                  <div className="flex items-center gap-1.5 text-sm">
                    {tour.keysReturned ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-600">Returned</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-amber-600">Not Returned</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Starting Mileage</span>
              <p className="font-medium mt-1">{tour.startingMileage.toLocaleString()} mi</p>
            </div>
            {tour.endingMileage && (
              <div>
                <span className="text-muted-foreground">Ending Mileage</span>
                <p className="font-medium mt-1">{tour.endingMileage.toLocaleString()} mi</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tour Stops */}
      <Card>
        <CardHeader>
          <CardTitle>Tour Stops</CardTitle>
          <CardDescription>
            {tour.tourStops.length > 0
              ? `${tour.tourStops.length} stop${tour.tourStops.length !== 1 ? "s" : ""} recorded`
              : "No stops recorded yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tour.tourStops.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No tour stops recorded</p>
              {isInProgress && (
                <p className="text-sm text-muted-foreground mt-1">
                  Add your first stop to begin documenting this tour
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {tour.tourStops.map((stop, index) => (
                <div key={stop.id} className="relative">
                  {/* Timeline connector */}
                  {index < tour.tourStops.length - 1 && (
                    <div className="absolute left-[15px] top-[40px] bottom-[-16px] w-0.5 bg-border" />
                  )}

                  <div className="flex gap-4">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-8 w-8 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                        <span className="text-xs font-medium">{index + 1}</span>
                      </div>
                    </div>

                    {/* Stop content */}
                    <div className="flex-1 pb-6">
                      <div className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{stop.title}</h4>
                              {getStopTypeBadge(stop.stopType)}
                            </div>
                            {stop.location && (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                {stop.location.name}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>{format(new Date(stop.arrivedAt), "MMM d, h:mm a")}</p>
                            {stop.departedAt && (
                              <p className="text-xs mt-1">
                                Departed: {format(new Date(stop.departedAt), "h:mm a")}
                              </p>
                            )}
                          </div>
                        </div>

                        <p className="text-sm whitespace-pre-wrap">{stop.observations}</p>

                        {/* Guard evaluation details */}
                        {stop.stopType === "GUARD_EVALUATION" && stop.guardUser && (
                          <Alert>
                            <User className="h-4 w-4" />
                            <AlertDescription>
                              <p className="font-medium">
                                Guard: {stop.guardUser.firstName} {stop.guardUser.lastName}
                              </p>
                              {stop.guardPerformanceNotes && (
                                <p className="text-sm mt-1">{stop.guardPerformanceNotes}</p>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Incident details */}
                        {stop.stopType === "INCIDENT_CHECK" && stop.issuesSeverity && (
                          <Alert variant={stop.issuesSeverity === "CRITICAL" || stop.issuesSeverity === "HIGH" ? "destructive" : "default"}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="flex items-center justify-between">
                                <p className="font-medium">Severity: {stop.issuesSeverity}</p>
                                {stop.followUpRequired && (
                                  <Badge variant="outline">Follow-up Required</Badge>
                                )}
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Notes */}
      {tour.notes && isCompleted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Final Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{tour.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Completion Info */}
      {isCompleted && tour.completedAt && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Tour Completed</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(tour.completedAt), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancellation Info */}
      {isCancelled && tour.completedAt && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">Tour Cancelled</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(tour.completedAt), "MMMM d, yyyy 'at' h:mm a")}
                </p>
                {tour.notes && (
                  <p className="text-sm mt-2">{tour.notes}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
