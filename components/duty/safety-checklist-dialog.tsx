"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  getSafetyChecklistItems,
  submitSafetyChecklist,
  type SafetyChecklistItem,
  type ChecklistItemData,
} from "@/lib/actions/safety-checklist-actions"

interface SafetyChecklistDialogProps {
  open: boolean
  dutySessionId: string
  locationId: string
  onComplete: () => void
  onCancel?: () => void
}

interface ChecklistFormData {
  items: {
    [key: string]: {
      checked: boolean
      notes: string
    }
  }
}

export function SafetyChecklistDialog({
  open,
  dutySessionId,
  locationId,
  onComplete,
  onCancel,
}: SafetyChecklistDialogProps) {
  const [checklistItems, setChecklistItems] = useState<SafetyChecklistItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const { register, handleSubmit, watch, setValue } = useForm<ChecklistFormData>({
    defaultValues: {
      items: {},
    },
  })

  const watchedItems = watch("items")

  // Fetch checklist items when dialog opens
  useEffect(() => {
    if (open) {
      const fetchItems = async () => {
        setIsFetching(true)
        const result = await getSafetyChecklistItems()

        if (result.ok && result.data) {
          setChecklistItems(result.data)

          // Initialize form values
          const initialItems: any = {}
          result.data.forEach((item) => {
            initialItems[item.id] = {
              checked: false,
              notes: "",
            }
          })
          setValue("items", initialItems)
        } else {
          toast.error(result.message || "Failed to load checklist items")
        }

        setIsFetching(false)
      }

      fetchItems()
    }
  }, [open, setValue])

  const onSubmit = async (data: ChecklistFormData) => {
    // Validate that all items are checked
    const allChecked = Object.values(data.items).every((item) => item.checked)

    if (!allChecked) {
      toast.error("Please check all safety items before proceeding")
      return
    }

    try {
      setIsLoading(true)

      // Transform form data to API format
      const checklistData: ChecklistItemData[] = Object.entries(data.items).map(
        ([itemId, itemData]) => ({
          itemId,
          checked: itemData.checked,
          notes: itemData.notes?.trim() || undefined,
        })
      )

      const result = await submitSafetyChecklist({
        dutySessionId,
        locationId,
        items: checklistData,
      })

      if (!result.ok) {
        throw new Error(result.message || "Failed to submit checklist")
      }

      toast.success("Safety checklist completed successfully")
      onComplete()
    } catch (error: any) {
      toast.error(error.message || "Failed to submit checklist")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  const allChecked =
    checklistItems.length > 0 &&
    Object.keys(watchedItems || {}).length > 0 &&
    Object.values(watchedItems || {}).every((item) => item?.checked)

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>On-Duty Safety Checklist</DialogTitle>
          <DialogDescription>
            Please verify all safety equipment before starting your shift. All items must be
            checked to proceed.
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {checklistItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={watchedItems?.[item.id]?.checked || false}
                      onCheckedChange={(checked) => {
                        setValue(`items.${item.id}.checked`, checked as boolean)
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`item-${item.id}`}
                        className="text-base font-medium cursor-pointer"
                      >
                        {item.name}
                      </Label>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>

                  {watchedItems?.[item.id]?.checked && (
                    <div className="ml-9">
                      <Label htmlFor={`notes-${item.id}`} className="text-sm">
                        Notes (optional)
                      </Label>
                      <Textarea
                        id={`notes-${item.id}`}
                        placeholder="Add any observations or issues..."
                        className="mt-1"
                        rows={2}
                        {...register(`items.${item.id}.notes`)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {Object.values(watchedItems || {}).filter((item) => item?.checked).length} of{" "}
                {checklistItems.length} items checked
              </p>

              <div className="flex gap-2">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={!allChecked || isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete Checklist
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
