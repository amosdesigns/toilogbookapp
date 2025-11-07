"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createLogSchema, type CreateLogInput, LogTypeEnum, RecordStatusEnum } from "@/lib/validations"
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
import { VideoUpload } from "@/components/video-upload"
import { useState } from "react"

interface LogFormProps {
  onSubmit: (data: CreateLogInput) => void | Promise<void>
  defaultValues?: Partial<CreateLogInput>
  locations: Array<{ id: string; name: string }>
  shifts?: Array<{ id: string; name: string }>
  isLoading?: boolean
  userId: string
}

export function LogForm({
  onSubmit,
  defaultValues,
  locations,
  shifts = [],
  isLoading = false,
  userId,
}: LogFormProps) {
  const [videoUrls, setVideoUrls] = useState<string[]>(
    defaultValues?.videoUrls ? JSON.parse(defaultValues.videoUrls) : []
  )

  const form = useForm<CreateLogInput>({
    resolver: zodResolver(createLogSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      type: defaultValues?.type || "PATROL",
      status: defaultValues?.status || "DRAFT",
      locationId: defaultValues?.locationId || "",
      shiftId: defaultValues?.shiftId || undefined,
      videoUrls: defaultValues?.videoUrls || undefined,
    },
  })

  const logTypes = LogTypeEnum.options
  const statusOptions = RecordStatusEnum.options

  const handleSubmit = (data: CreateLogInput) => {
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
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Log Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select log type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {logTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Type of log entry (incident, patrol, visitor check-in, etc.)
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
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter log title" {...field} />
              </FormControl>
              <FormDescription>
                Brief summary of the log entry
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter detailed description"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Detailed information about this log entry
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="locationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
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
                Marina location where this log entry occurred
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  Associate this log with a specific shift
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
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
                Current status of this log entry
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Videos (Optional)</FormLabel>
          <VideoUpload
            onVideosChange={setVideoUrls}
            initialVideos={videoUrls}
            userId={userId}
            maxVideos={3}
            maxSizeMB={100}
          />
          <FormDescription>
            Upload up to 3 videos (100MB max each)
          </FormDescription>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Log"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
