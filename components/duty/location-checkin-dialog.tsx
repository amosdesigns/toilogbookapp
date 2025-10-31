"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, CheckCircle } from "lucide-react"

const locationCheckInSchema = z.object({
  locationId: z.string().min(1, "Please select a location"),
  notes: z.string().optional(),
})

type LocationCheckInFormData = z.infer<typeof locationCheckInSchema>

interface LocationCheckInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: LocationCheckInFormData) => Promise<void>
  locations: Array<{ id: string; name: string }>
  dutySessionId: string
  isLoading?: boolean
}

export function LocationCheckInDialog({
  open,
  onOpenChange,
  onSubmit,
  locations,
  dutySessionId,
  isLoading = false,
}: LocationCheckInDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<LocationCheckInFormData>({
    resolver: zodResolver(locationCheckInSchema),
    defaultValues: {
      locationId: "",
      notes: "",
    },
  })

  const handleSubmit = async (data: LocationCheckInFormData) => {
    try {
      setError(null)
      setSuccess(false)
      await onSubmit(data)
      setSuccess(true)
      form.reset()

      // Auto-close after success
      setTimeout(() => {
        onOpenChange(false)
        setSuccess(false)
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Failed to record check-in")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Location Check-In</DialogTitle>
          <DialogDescription>
            Record your arrival at a marina location during your roaming duty.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              Check-in recorded successfully!
            </AlertDescription>
          </Alert>
        ) : (
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
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location to check in" />
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
                      Where are you checking in from?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Optional Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observations (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any observations or notes about this location..."
                        className="min-h-[100px]"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Document any notable observations during this check-in
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Recording..." : "Check In"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
