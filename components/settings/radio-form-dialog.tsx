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
import { radioSchema, type RadioFormData } from '@/lib/validations/radio'
import { createRadio, updateRadio, type RadioWithLocation } from '@/lib/actions/radio-actions'

interface RadioFormDialogProps {
  open: boolean
  radio?: RadioWithLocation
  locations: { id: string; name: string }[]
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function RadioFormDialog({ open, radio, locations, onOpenChange, onSuccess }: RadioFormDialogProps) {
  const isEdit = Boolean(radio)

  const form = useForm<RadioFormData>({
    resolver: zodResolver(radioSchema),
    defaultValues: {
      name: '', serialNumber: '', model: '',
      channel: '', status: 'WORKING', locationId: '', notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(radio ? {
        name: radio.name,
        serialNumber: radio.serialNumber ?? '',
        model: radio.model ?? '',
        channel: radio.channel ?? '',
        status: radio.status,
        locationId: radio.locationId ?? '',
        notes: radio.notes ?? '',
      } : {
        name: '', serialNumber: '', model: '',
        channel: '', status: 'WORKING', locationId: '', notes: '',
      })
    }
  }, [open, radio, form])

  const onSubmit = async (data: RadioFormData) => {
    const result = isEdit
      ? await updateRadio(radio!.id, data)
      : await createRadio(data)

    if (result.ok) {
      toast.success(result.message)
      onSuccess()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Radio' : 'Add Radio'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Radio Name / ID *</FormLabel>
                  <FormControl><Input placeholder="e.g. Radio 1, Portable 3" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem>
                  <FormLabel>Model / Brand</FormLabel>
                  <FormControl><Input placeholder="Motorola, Kenwood…" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="channel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel</FormLabel>
                  <FormControl><Input placeholder="Ch. 3, Dispatch…" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="serialNumber" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Manufacturer serial number" className="font-mono"
                      {...field} value={field.value ?? ''} />
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
                <FormItem>
                  <FormLabel>Assigned Location</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="No location" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No location assigned</SelectItem>
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
                    <Textarea placeholder="e.g. battery draining fast, sent for repair…"
                      rows={3} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Radio'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
