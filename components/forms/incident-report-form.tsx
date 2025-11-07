"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createIncidentReportSchema, type CreateIncidentReportInput, IncidentSeverityEnum, RecordStatusEnum } from "@/lib/validations"
import { format } from "date-fns"
import { Calendar as CalendarIcon, AlertTriangle } from "lucide-react"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { VideoUpload } from "@/components/video-upload"
import { useState } from "react"

interface IncidentReportFormProps {
  onSubmit: (data: CreateIncidentReportInput) => void | Promise<void>
  defaultValues?: Partial<CreateIncidentReportInput>
  locations: Array<{ id: string; name: string }>
  shifts?: Array<{ id: string; name: string }>
  isLoading?: boolean
  currentLocationId?: string // Auto-fill if guard is on duty
  userId: string
}

export function IncidentReportForm({
  onSubmit,
  defaultValues,
  locations,
  shifts = [],
  isLoading = false,
  currentLocationId,
  userId,
}: IncidentReportFormProps) {
  const [videoUrls, setVideoUrls] = useState<string[]>(
    defaultValues?.videoUrls ? JSON.parse(defaultValues.videoUrls) : []
  )

  const form = useForm<CreateIncidentReportInput>({
    resolver: zodResolver(createIncidentReportSchema),
    defaultValues: {
      type: "INCIDENT",
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      status: defaultValues?.status || "DRAFT",
      locationId: defaultValues?.locationId || currentLocationId || "",
      shiftId: defaultValues?.shiftId || undefined,
      severity: defaultValues?.severity || "MEDIUM",
      incidentTime: defaultValues?.incidentTime || new Date(),
      peopleInvolved: defaultValues?.peopleInvolved || "",
      witnesses: defaultValues?.witnesses || "",
      actionsTaken: defaultValues?.actionsTaken || "",
      followUpRequired: defaultValues?.followUpRequired || false,
      followUpNotes: defaultValues?.followUpNotes || "",
      weatherConditions: defaultValues?.weatherConditions || "",
    },
  })

  const severityOptions = IncidentSeverityEnum.options
  const statusOptions = RecordStatusEnum.options
  const followUpRequired = form.watch("followUpRequired")

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "LOW": return "text-green-600 bg-green-50"
      case "MEDIUM": return "text-yellow-600 bg-yellow-50"
      case "HIGH": return "text-orange-600 bg-orange-50"
      case "CRITICAL": return "text-red-600 bg-red-50"
      default: return ""
    }
  }

  const handleSubmit = (data: CreateIncidentReportInput) => {
    // Add video URLs as JSON string
    const submitData = {
      ...data,
      videoUrls: videoUrls.length > 0 ? JSON.stringify(videoUrls) : undefined,
    }
    onSubmit(submitData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Complete this form as soon as possible after the incident. Include all relevant details.
          </AlertDescription>
        </Alert>

        {/* Severity */}
        <FormField
          control={form.control}
          name="severity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Severity Level *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {severityOptions.map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      <div className={cn("px-2 py-1 rounded", getSeverityColor(severity))}>
                        {severity}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                How serious is this incident?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Incident Time */}
        <FormField
          control={form.control}
          name="incidentTime"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Incident Date & Time *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP p")
                      ) : (
                        <span>Pick date and time</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      if (date) {
                        const currentTime = field.value || new Date()
                        date.setHours(currentTime.getHours())
                        date.setMinutes(currentTime.getMinutes())
                        field.onChange(date)
                      }
                    }}
                    initialFocus
                  />
                  <div className="p-3 border-t">
                    <Input
                      type="time"
                      value={field.value ? format(field.value, "HH:mm") : ""}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(":")
                        const date = field.value || new Date()
                        date.setHours(parseInt(hours))
                        date.setMinutes(parseInt(minutes))
                        field.onChange(new Date(date))
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <FormDescription>
                When did the incident occur?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Incident Title *</FormLabel>
              <FormControl>
                <Input placeholder="Brief summary of incident" {...field} />
              </FormControl>
              <FormDescription>
                Short description (e.g., "Unauthorized access attempt")
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location */}
        <FormField
          control={form.control}
          name="locationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Where did this incident occur?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detailed Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide a detailed account of what happened..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Include what happened, when, where, and any relevant context
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* People Involved */}
        <FormField
          control={form.control}
          name="peopleInvolved"
          render={({ field }) => (
            <FormItem>
              <FormLabel>People Involved (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Names, descriptions, roles..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                List anyone involved in the incident
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Witnesses */}
        <FormField
          control={form.control}
          name="witnesses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Witnesses (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Names, contact information..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                List anyone who witnessed the incident
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions Taken */}
        <FormField
          control={form.control}
          name="actionsTaken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Actions Taken (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What steps did you take in response?"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Describe how you responded to the incident
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Weather Conditions */}
        <FormField
          control={form.control}
          name="weatherConditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weather Conditions (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Clear, Rainy, Foggy..." {...field} />
              </FormControl>
              <FormDescription>
                Current weather at time of incident
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Follow-up Required */}
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
                <FormLabel>
                  Follow-up Required
                </FormLabel>
                <FormDescription>
                  Check if this incident requires follow-up action
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Follow-up Notes (conditional) */}
        {followUpRequired && (
          <FormField
            control={form.control}
            name="followUpNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Follow-up Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What follow-up actions are needed?"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Describe what needs to be done
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Shift (optional) */}
        {shifts.length > 0 && (
          <FormField
            control={form.control}
            name="shiftId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Associated Shift (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {shifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {shift.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Link this incident to a specific shift
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Save as DRAFT to finish later, or LIVE to submit
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Video Upload */}
        <div className="space-y-2">
          <FormLabel>Evidence Videos (Optional)</FormLabel>
          <VideoUpload
            onVideosChange={setVideoUrls}
            initialVideos={videoUrls}
            userId={userId}
            maxVideos={3}
            maxSizeMB={100}
          />
          <FormDescription>
            Upload up to 3 videos as evidence (100MB max each)
          </FormDescription>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Incident Report"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
