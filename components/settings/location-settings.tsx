'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, MapPin, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LocationFormDialog } from './location-form-dialog'
import { getAllLocationsAdmin, deleteLocation, type Location } from '@/lib/actions/location-actions'
import type { Role } from '@prisma/client'

interface LocationSettingsProps {
  user: {
    id: string
    firstName: string
    lastName: string
    role: Role
  }
}

export function LocationSettings({ user }: LocationSettingsProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [formDialog, setFormDialog] = useState<{ open: boolean; location?: Location }>({ open: false })
  const [deleteConfirm, setDeleteConfirm] = useState<Location | null>(null)

  // Load locations
  const loadLocations = async () => {
    setLoading(true)
    const result = await getAllLocationsAdmin()
    if (result.ok) {
      setLocations(result.data)
    } else {
      toast.error(result.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadLocations()
  }, [])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const result = await deleteLocation(deleteConfirm.id)
    if (result.ok) {
      toast.success(result.message)
      loadLocations()
    } else {
      toast.error(result.message)
    }
    setDeleteConfirm(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const activeLocations = locations.filter((loc) => loc.isActive)
  const inactiveLocations = locations.filter((loc) => !loc.isActive)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {activeLocations.length} active locations • {inactiveLocations.length} inactive
            locations
          </p>
        </div>
        <Button size="sm" onClick={() => setFormDialog({ open: true })}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {locations.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">No locations configured</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-32">Max Capacity</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id} className={!location.isActive ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {location.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {location.address || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                    {location.description || '—'}
                  </TableCell>
                  <TableCell>
                    {location.maxCapacity ? (
                      <span className="font-medium">{location.maxCapacity} guards</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={location.isActive ? 'default' : 'secondary'}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Edit location"
                        onClick={() => setFormDialog({ open: true, location })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete location"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(location)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <LocationFormDialog
        open={formDialog.open}
        location={formDialog.location}
        onOpenChange={(open) => setFormDialog((prev) => ({ ...prev, open }))}
        onSuccess={() => { setFormDialog({ open: false }); loadLocations() }}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Deactivate Location
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{deleteConfirm?.name}</strong>? It will no longer
              be available for new logs, shifts, or duty check-ins, but existing records are preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
