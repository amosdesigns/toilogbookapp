"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MapPin, Clock, Loader2 } from "lucide-react"
import { getSafetyChecklistItems, type SafetyChecklistItem } from "@/lib/actions/safety-checklist-actions"
import { toast } from "sonner"

// Schema for guards - locationId is required
const guardClockInSchema = z.object({
  locationId: z.string().min(1, "Location is required"),
  shiftId: z.string().optional(),
})

type ClockInFormData = z.infer<typeof guardClockInSchema>

interface ClockInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ClockInFormData) => Promise<void>
  locations: Array<{ id: string; name: string }>
  shifts?: Array<{ id: string; name: string }>
  isLoading?: boolean
}

export function ClockInDialog({
  open,
  onOpenChange,
  onSubmit,
  locations,
  shifts = [],
  isLoading = false,
}: ClockInDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [safetyItems, setSafetyItems] = useState<SafetyChecklistItem[]>([])
  const [checklistState, setChecklistState] = useState<Record<string, { checked: boolean; notes: string }>>({})
  const [isFetchingItems, setIsFetchingItems] = useState(false)

  const form = useForm<ClockInFormData>({
    resolver: zodResolver(guardClockInSchema),
    defaultValues: {
      locationId: "",
      shiftId: "",
    },
  })

  // Fetch safety checklist items when dialog opens
  useEffect(() => {
    if (open) {
      const fetchItems = async () => {
        setIsFetchingItems(true)
        const result = await getSafetyChecklistItems()
        if (result.ok && result.data) {
          setSafetyItems(result.data)
          // Initialize checklist state
          const initialState: Record<string, { checked: boolean; notes: string }> = {}
          result.data.forEach(item => {
            initialState[item.id] = { checked: false, notes: "" }
          })
          setChecklistState(initialState)
        } else {
          toast.error("Failed to load safety checklist items")
        }
        setIsFetchingItems(false)
      }
      fetchItems()
    }
  }, [open])

  const handleSubmit = async (data: ClockInFormData) => {
    try {
      setError(null)

      // Validate that all safety items are checked
      if (safetyItems.length > 0) {
        const allChecked = Object.values(checklistState).every(item => item.checked)
        if (!allChecked) {
          setError("Please check all safety items before clocking in")
          return
        }
      }

      // Pass checklist data to parent handler
      const submitData = {
        ...data,
        checklistItems: checklistState
      }

      await onSubmit(submitData)
      form.reset()
      setChecklistState({})
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Failed to clock in")
    }
  }

  // Check if all checklist items are checked
  const allItemsChecked = safetyItems.length > 0
    ? Object.values(checklistState).every(item => item?.checked)
    : true

  const checkedCount = Object.values(checklistState).filter(item => item?.checked).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report for Duty</DialogTitle>
          <DialogDescription>
            Select your location and complete the safety equipment checklist to clock in.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Location Selection */}
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {location.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose where you'll be stationed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Optional Shift Linking */}
                {shifts.length > 0 && (
                  <FormField
                    control={form.control}
                    name="shiftId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shift (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Link to a shift" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {shifts.map((shift) => (
                              <SelectItem key={shift.id} value={shift.id}>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {shift.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Link this duty session to a scheduled shift
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Safety Checklist */}
                {safetyItems.length > 0 && (
                  <div className="space-y-3 border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Safety Equipment Checklist</Label>
                      <span className="text-sm text-muted-foreground">
                        {checkedCount}/{safetyItems.length} checked
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Please verify all safety equipment before starting your shift
                    </p>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {safetyItems.map((item) => (
                        <div key={item.id} className="border rounded-md p-3 space-y-2">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`safety-${item.id}`}
                              checked={checklistState[item.id]?.checked || false}
                              onCheckedChange={(checked) => {
                                setChecklistState(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    checked: checked as boolean
                                  }
                                }))
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={`safety-${item.id}`}
                                className="font-medium cursor-pointer"
                              >
                                {item.name}
                              </Label>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {checklistState[item.id]?.checked && (
                            <Textarea
                              placeholder="Add any observations or issues (optional)"
                              value={checklistState[item.id]?.notes || ""}
                              onChange={(e) => {
                                setChecklistState(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    notes: e.target.value
                                  }
                                }))
                              }}
                              rows={2}
                              className="text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !allItemsChecked || isFetchingItems}
              >
                {isLoading ? "Clocking In..." : isFetchingItems ? "Loading..." : "Clock In"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
