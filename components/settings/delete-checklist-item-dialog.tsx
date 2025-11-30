'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  deleteSafetyChecklistItem,
  type SafetyChecklistItem,
} from '@/lib/actions/safety-checklist-actions'

interface DeleteChecklistItemDialogProps {
  item: SafetyChecklistItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteChecklistItemDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: DeleteChecklistItemDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    const result = await deleteSafetyChecklistItem(item.id)
    setLoading(false)

    if (result.ok) {
      toast.success(result.message)
      onSuccess()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Checklist Item</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{item.name}</strong>? This will set the item to
            inactive and it will no longer appear in guard check-ins.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive">
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
