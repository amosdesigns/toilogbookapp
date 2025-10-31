"use client"

import { ShiftWithDetails } from "@/types/shift-calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/utils"
import { Calendar, MapPin, User, Edit, Trash2 } from "lucide-react"
import { Role } from "@/types"
import { canManageShifts } from "@/lib/utils/auth"

interface ShiftCardProps {
  shift: ShiftWithDetails
  userRole: Role
  userId: string
  onEdit?: (shift: ShiftWithDetails) => void
  onDelete?: (shiftId: string) => void
}

export function ShiftCard({ shift, userRole, userId, onEdit, onDelete }: ShiftCardProps) {
  const canManage = canManageShifts(userRole)

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{shift.name}</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4" />
                <span>{shift.location.name}</span>
              </div>
            </CardDescription>
          </div>
          {canManage && (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(shift)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDelete(shift.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Start:</span>
            <span>{formatDateTime(shift.startTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">End:</span>
            <span>{formatDateTime(shift.endTime)}</span>
          </div>
        </div>

        {shift.supervisor && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Supervisor:</span>
            <Badge variant="secondary">
              {shift.supervisor.firstName} {shift.supervisor.lastName}
            </Badge>
          </div>
        )}

        {shift.location.address && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Address:</span> {shift.location.address}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
