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
  DialogTrigger,
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPinPlus, Loader2 } from "lucide-react"
import { createTourStop } from "@/lib/actions/tour-actions"
import { createTourStopSchema } from "@/lib/validations/tour"
import { toast } from "sonner"

type TourStopFormData = z.infer<typeof createTourStopSchema>

interface TourStopDialogProps {
  tourId: string
  locations: Array<{ id: string; name: string }>
  guards?: Array<{ id: string; firstName: string; lastName: string }>
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function TourStopDialog({
  tourId,
  locations,
  guards = [],
  trigger,
  onSuccess,
}: TourStopDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<TourStopFormData>({
    resolver: zodResolver(createTourStopSchema),
    defaultValues: {
      tourId,
      locationId: "",
      stopType: "GENERAL_OBSERVATION",
      title: "",
      observations: "",
      photoUrls: [],
      guardUserId: "",
      guardPerformanceNotes: "",
      issuesSeverity: undefined,
      followUpRequired: false,
    },
  })

  const stopType = form.watch("stopType")
  const guardUserId = form.watch("guardUserId")
  const issuesSeverity = form.watch("issuesSeverity")

  const onSubmit = async (data: TourStopFormData) => {
    try {
      setIsLoading(true)

      const result = await createTourStop(data)

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message || "Tour stop added successfully")
      form.reset()
      setOpen(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast.error("An error occurred while adding the tour stop")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <MapPinPlus className="h-4 w-4 mr-2" />
            Add Stop
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Tour Stop</DialogTitle>
          <DialogDescription>
            Record observations and activities at this location.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="stopType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stop Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stop type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LOCATION_INSPECTION">Location Inspection</SelectItem>
                      <SelectItem value="GUARD_EVALUATION">Guard Evaluation</SelectItem>
                      <SelectItem value="INCIDENT_CHECK">Incident Check</SelectItem>
                      <SelectItem value="GENERAL_OBSERVATION">General Observation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the location for this stop, or leave blank for general observations.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of this stop" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observations *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed observations, notes, and findings..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Guard Evaluation Fields */}
            {stopType === "GUARD_EVALUATION" && (
              <>
                <FormField
                  control={form.control}
                  name="guardUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guard Being Evaluated</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a guard" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {guards.map((guard) => (
                            <SelectItem key={guard.id} value={guard.id}>
                              {guard.firstName} {guard.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {guardUserId && (
                  <FormField
                    control={form.control}
                    name="guardPerformanceNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Performance Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Evaluation notes, feedback, and recommendations..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            {/* Incident Check Fields */}
            {stopType === "INCIDENT_CHECK" && (
              <>
                <FormField
                  control={form.control}
                  name="issuesSeverity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Severity</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {issuesSeverity && (
                  <FormField
                    control={form.control}
                    name="followUpRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Follow-up Required</FormLabel>
                          <FormDescription>
                            Check if this issue requires follow-up action.
                          </FormDescription>
                        </div>
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
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Stop
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
