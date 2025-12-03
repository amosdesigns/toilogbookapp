"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Clock,
  Car,
  Radio,
  MapPinPlus,
  CheckCircle2,
  ChevronRight,
  Calendar
} from "lucide-react"
import { CompleteTourDialog } from "./complete-tour-dialog"
import { TourStopDialog } from "./tour-stop-dialog"
import type { TourWithSupervisor } from "@/lib/types/prisma-types"

interface ActiveTourCardProps {
  tour: TourWithSupervisor
  locations: Array<{ id: string; name: string }>
  guards?: Array<{ id: string; firstName: string; lastName: string }>
}

export function ActiveTourCard({ tour, locations, guards = [] }: ActiveTourCardProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleSuccess = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const timeElapsed = formatDistanceToNow(new Date(tour.startedAt), { addSuffix: false })
  const stopsCount = tour.tourStops.length
  const visitedLocations = tour.tourStops
    .filter((stop) => stop.location)
    .map((stop) => stop.location!.name)

  // Calculate hours on tour for display
  const hoursElapsed = Math.floor(
    (Date.now() - new Date(tour.startedAt).getTime()) / (1000 * 60 * 60)
  )
  const minutesElapsed = Math.floor(
    ((Date.now() - new Date(tour.startedAt).getTime()) % (1000 * 60 * 60)) / (1000 * 60)
  )

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Badge variant="default" className="gap-1">
                <Clock className="h-3 w-3" />
                Active Tour
              </Badge>
              {tour.title && <span className="text-base font-normal">{tour.title}</span>}
            </CardTitle>
            <CardDescription>
              Started {timeElapsed} ago
            </CardDescription>
          </div>
          <Link href={`/admin/tours/${tour.id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              View Details
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Time and Progress */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Duration</span>
            </div>
            <p className="font-medium">
              {hoursElapsed}h {minutesElapsed}m
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>Stops</span>
            </div>
            <p className="font-medium">{stopsCount}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Locations</span>
            </div>
            <p className="font-medium">{visitedLocations.length || "None"}</p>
          </div>
        </div>

        <Separator />

        {/* Equipment Checked Out */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Equipment Checked Out</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-md border bg-background p-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Car</span>
                <span className="font-medium">{tour.carNumber}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md border bg-background p-2">
              <Radio className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Radio</span>
                <span className="font-medium">{tour.radioNumber}</span>
              </div>
            </div>
          </div>
          <div className="rounded-md border bg-background p-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Starting Mileage</span>
              <span className="font-medium">{tour.startingMileage.toLocaleString()} mi</span>
            </div>
          </div>
        </div>

        {/* Visited Locations */}
        {visitedLocations.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Recent Locations</h4>
              <div className="flex flex-wrap gap-1.5">
                {visitedLocations.slice(0, 5).map((location, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {location}
                  </Badge>
                ))}
                {visitedLocations.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{visitedLocations.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <TourStopDialog
            tourId={tour.id}
            locations={locations}
            guards={guards}
            onSuccess={handleSuccess}
            trigger={
              <Button variant="outline" size="sm" className="flex-1 gap-2" disabled={isRefreshing}>
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
            totalStops={stopsCount}
            locations={visitedLocations}
            trigger={
              <Button size="sm" className="flex-1 gap-2" disabled={isRefreshing}>
                <CheckCircle2 className="h-4 w-4" />
                Complete Tour
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
