'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { vehicleSchema, type VehicleFormData } from '@/lib/validations/vehicle'
import { createVehicle, updateVehicle, type VehicleWithLocation } from '@/lib/actions/vehicle-actions'

interface VehicleFormDialogProps {
  open: boolean
  vehicle?: VehicleWithLocation
  locations: { id: string; name: string }[]
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function VehicleFormDialog({ open, vehicle, locations, onOpenChange, onSuccess }: VehicleFormDialogProps) {
  const isEdit = Boolean(vehicle)

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: '', make: '', model: '',
      year: new Date().getFullYear(),
      vin: '', licensePlate: '', mileage: 0,
      status: 'WORKING', locationId: '', notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(vehicle ? {
        name: vehicle.name,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin ?? '',
        licensePlate: vehicle.licensePlate ?? '',
        mileage: vehicle.mileage,
        status: vehicle.status,
        locationId: vehicle.locationId ?? '',
        notes: vehicle.notes ?? '',
      } : {
        name: '', make: '', model: '',
        year: new Date().getFullYear(),
        vin: '', licensePlate: '', mileage: 0,
        status: 'WORKING', locationId: '', notes: '',
      })
    }
  }, [open, vehicle, form])

  const onSubmit = async (data: VehicleFormData) => {
    const result = isEdit
      ? await updateVehicle(vehicle!.id, data)
      : await createVehicle(data)

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
          <DialogTitle>{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Unit Name *</FormLabel>
                  <FormControl><Input placeholder="e.g. Unit 3, Blue Pickup" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="year" render={({ field }) => (
                <FormItem>
                  <FormLabel>Year *</FormLabel>
                  <FormControl>
                    <Input type="number" min={1900} max={new Date().getFullYear() + 1}
                      {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="make" render={({ field }) => (
                <FormItem>
                  <FormLabel>Make *</FormLabel>
                  <FormControl><Input placeholder="Ford, Toyota…" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem>
                  <FormLabel>Model *</FormLabel>
                  <FormControl><Input placeholder="F-150, Tacoma…" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="licensePlate" render={({ field }) => (
                <FormItem>
                  <FormLabel>License Plate</FormLabel>
                  <FormControl><Input placeholder="ABC-1234" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="vin" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>VIN</FormLabel>
                  <FormControl>
                    <Input placeholder="17-character VIN" className="font-mono" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="mileage" render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Mileage</FormLabel>
                  <FormControl>
                    <Input type="number" min={0}
                      {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="WORKING">Working</SelectItem>
                      <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                      <SelectItem value="RETIRED">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="locationId" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Assigned Location</FormLabel>
                  <Select
                    onValueChange={value => field.onChange(value === 'none' ? '' : value)}
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="No location assigned" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No location assigned</SelectItem>
                      {locations.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. needs oil change, clicking noise on brakes…"
                      rows={3} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
