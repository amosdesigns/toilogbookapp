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
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Clock } from "lucide-react"

const clockInSchema = z.object({
  locationId: z.string().optional(),
  shiftId: z.string().optional(),
})

type ClockInFormData = z.infer<typeof clockInSchema>

interface ClockInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ClockInFormData) => Promise<void>
  locations: Array<{ id: string; name: string }>
  shifts?: Array<{ id: string; name: string }>
  userRole: "GUARD" | "SUPERVISOR" | "ADMIN" | "SUPER_ADMIN"
  isLoading?: boolean
}

export function ClockInDialog({
  open,
  onOpenChange,
  onSubmit,
  locations,
  shifts = [],
  userRole,
  isLoading = false,
}: ClockInDialogProps) {
  const isGuard = userRole === "GUARD"
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ClockInFormData>({
    resolver: zodResolver(clockInSchema),
    defaultValues: {
      locationId: "",
      shiftId: "",
    },
  })

  const handleSubmit = async (data: ClockInFormData) => {
    try {
      setError(null)
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Failed to clock in")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report for Duty</DialogTitle>
          <DialogDescription>
            {isGuard
              ? "Select the marina location where you'll be working."
              : "Start your roaming duty across all locations."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isGuard ? (
              <>
                {/* Location Selection for Guards */}
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
              </>
            ) : (
              <>
                {/* Supervisor Roaming Duty */}
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    As a supervisor, you'll be on roaming duty across all {locations.length} locations.
                    You'll need to check in at each location during your shift.
                  </AlertDescription>
                </Alert>

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
              </>
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Clocking In..." : "Clock In"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
