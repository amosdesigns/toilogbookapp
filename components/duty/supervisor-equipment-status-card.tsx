"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Car, Radio, Clock, MapPin } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { SupervisorEquipmentCheckout, SupervisorEquipment } from "@prisma/client"

type EquipmentCheckoutWithEquipment = SupervisorEquipmentCheckout & {
  equipment: SupervisorEquipment
}

interface SupervisorEquipmentStatusCardProps {
  equipmentCheckouts: EquipmentCheckoutWithEquipment[]
  clockInTime: Date
  onClockOut: () => void
}

export function SupervisorEquipmentStatusCard({
  equipmentCheckouts,
  clockInTime,
  onClockOut,
}: SupervisorEquipmentStatusCardProps) {
  // Find car and radio from checkouts
  const carCheckout = equipmentCheckouts.find((c) => c.equipment.type === "CAR")
  const radioCheckout = equipmentCheckouts.find((c) => c.equipment.type === "RADIO")

  const hoursOnDuty = formatDistanceToNow(new Date(clockInTime), { addSuffix: false })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Supervisor On Duty</CardTitle>
            <CardDescription>HQ - Headquarters</CardDescription>
          </div>
          <Badge variant="default" className="bg-green-600">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>On duty for {hoursOnDuty}</span>
        </div>

        {/* Equipment Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Checked Out Equipment</h4>

          {/* Car */}
          {carCheckout && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{carCheckout.equipment.identifier}</p>
                <p className="text-sm text-muted-foreground">
                  Starting: {carCheckout.checkoutMileage?.toLocaleString()} miles
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Checked out {formatDistanceToNow(new Date(carCheckout.checkoutTime), { addSuffix: true })}
                </p>
              </div>
            </div>
          )}

          {/* Radio */}
          {radioCheckout && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Radio className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{radioCheckout.equipment.identifier}</p>
                <p className="text-sm text-muted-foreground">Radio</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Checked out {formatDistanceToNow(new Date(radioCheckout.checkoutTime), { addSuffix: true })}
                </p>
              </div>
            </div>
          )}

          {equipmentCheckouts.length === 0 && (
            <p className="text-sm text-muted-foreground">No equipment checked out</p>
          )}
        </div>

        {/* Clock Out Button */}
        <Button onClick={onClockOut} className="w-full" variant="destructive">
          Sign Off Duty & Return Equipment
        </Button>
      </CardContent>
    </Card>
  )
}
