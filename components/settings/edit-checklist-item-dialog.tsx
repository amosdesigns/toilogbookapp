'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  updateSafetyChecklistItem,
  type SafetyChecklistItem,
} from '@/lib/actions/safety-checklist-actions'
import {
  updateSafetyChecklistItemSchema,
  type UpdateSafetyChecklistItemInput,
} from '@/lib/validations/safety-checklist'

interface EditChecklistItemDialogProps {
  item: SafetyChecklistItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditChecklistItemDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: EditChecklistItemDialogProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(updateSafetyChecklistItemSchema),
    defaultValues: {
      name: item.name,
      description: item.description || '',
      order: item.order,
      isActive: item.isActive ?? true,
    },
  })

  // Reset form when item changes
  useEffect(() => {
    form.reset({
      name: item.name,
      description: item.description || '',
      order: item.order,
      isActive: item.isActive ?? true,
    })
  }, [item, form])

  const onSubmit = async (data: UpdateSafetyChecklistItemInput) => {
    setLoading(true)
    const result = await updateSafetyChecklistItem(item.id, data)
    setLoading(false)

    if (result.ok) {
      toast.success(result.message)
      onSuccess()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Checklist Item</DialogTitle>
          <DialogDescription>Update the safety checklist item details.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ''} />
                  </FormControl>
                  <FormDescription>
                    Provide additional context or instructions for this checklist item.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Inactive items will not be shown to guards during clock-in
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
