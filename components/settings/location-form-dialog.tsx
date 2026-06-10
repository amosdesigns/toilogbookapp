'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { LocationForm } from '@/components/forms/location-form'
import { createLocation, updateLocation, type Location } from '@/lib/actions/location-actions'
import type { CreateLocationInput } from '@/lib/validations'

interface LocationFormDialogProps {
  open: boolean
  location?: Location
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function LocationFormDialog({ open, location, onOpenChange, onSuccess }: LocationFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEdit = Boolean(location)

  const handleSubmit = async (data: CreateLocationInput) => {
    setIsLoading(true)
    const result = isEdit
      ? await updateLocation(location!.id, data)
      : await createLocation(data)
    setIsLoading(false)

    if (result.ok) {
      toast.success(result.message)
      onSuccess()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Location' : 'Add Location'}</DialogTitle>
        </DialogHeader>
        <LocationForm
          key={open ? location?.id ?? 'new' : 'closed'}
          onSubmit={handleSubmit}
          defaultValues={location ? {
            name: location.name,
            description: location.description,
            address: location.address ?? '',
            maxCapacity: location.maxCapacity,
            isActive: location.isActive,
          } : undefined}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  )
}
