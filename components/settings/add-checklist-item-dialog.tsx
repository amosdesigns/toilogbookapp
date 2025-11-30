'use client'

import { useState } from 'react'
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
import { createSafetyChecklistItem } from '@/lib/actions/safety-checklist-actions'
import {
  createSafetyChecklistItemSchema,
  type CreateSafetyChecklistItemInput,
} from '@/lib/validations/safety-checklist'

interface AddChecklistItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddChecklistItemDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddChecklistItemDialogProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<CreateSafetyChecklistItemInput>({
    resolver: zodResolver(createSafetyChecklistItemSchema),
    defaultValues: {
      name: '',
      description: '',
      order: 0,
      isActive: true,
    },
  })

  const onSubmit = async (data: CreateSafetyChecklistItemInput) => {
    setLoading(true)
    const result = await createSafetyChecklistItem(data)
    setLoading(false)

    if (result.ok) {
      toast.success(result.message)
      form.reset()
      onSuccess()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Checklist Item</DialogTitle>
          <DialogDescription>
            Create a new safety checklist item for guards to check during clock-in.
          </DialogDescription>
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
                    <Input placeholder="e.g., Fire extinguishers checked" {...field} />
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
                    <Textarea
                      placeholder="Additional details or instructions..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide additional context or instructions for this checklist item.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
