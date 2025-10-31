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
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, MapPin, User, CheckCircle } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

const reviewSchema = z.object({
  reviewNotes: z.string().min(10, "Please provide detailed review notes (at least 10 characters)"),
})

type ReviewFormData = z.infer<typeof reviewSchema>

interface IncidentData {
  id: string
  title: string
  description: string
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  incidentTime: Date
  location: {
    name: string
  }
  user: {
    firstName: string
    lastName: string
  }
  peopleInvolved?: string
  witnesses?: string
  actionsTaken?: string
  followUpRequired?: boolean
  followUpNotes?: string
}

interface IncidentReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incident: IncidentData | null
  onSubmit: (incidentId: string, data: ReviewFormData) => Promise<void>
  isLoading?: boolean
}

const severityColors = {
  LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function IncidentReviewDialog({
  open,
  onOpenChange,
  incident,
  onSubmit,
  isLoading = false,
}: IncidentReviewDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      reviewNotes: "",
    },
  })

  const handleSubmit = async (data: ReviewFormData) => {
    if (!incident) return

    try {
      setError(null)
      setSuccess(false)
      await onSubmit(incident.id, data)
      setSuccess(true)
      form.reset()

      // Auto-close after success
      setTimeout(() => {
        onOpenChange(false)
        setSuccess(false)
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Failed to submit review")
    }
  }

  if (!incident) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">Review Incident Report</DialogTitle>
              <DialogDescription>
                Review and acknowledge this incident report
              </DialogDescription>
            </div>
            <Badge className={severityColors[incident.severity]}>
              {incident.severity}
            </Badge>
          </div>
        </DialogHeader>

        {success ? (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              Review submitted successfully!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Incident Details */}
            <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
              <div>
                <h3 className="font-semibold text-lg">{incident.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {incident.description}
                </p>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Incident Time:</span>
                  <span className="font-medium">{formatDateTime(incident.incidentTime)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{incident.location.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Reported By:</span>
                  <span className="font-medium">
                    {incident.user.firstName} {incident.user.lastName}
                  </span>
                </div>
              </div>

              {incident.peopleInvolved && (
                <div>
                  <p className="text-sm font-medium mb-1">People Involved:</p>
                  <p className="text-sm text-muted-foreground">{incident.peopleInvolved}</p>
                </div>
              )}

              {incident.witnesses && (
                <div>
                  <p className="text-sm font-medium mb-1">Witnesses:</p>
                  <p className="text-sm text-muted-foreground">{incident.witnesses}</p>
                </div>
              )}

              {incident.actionsTaken && (
                <div>
                  <p className="text-sm font-medium mb-1">Actions Taken:</p>
                  <p className="text-sm text-muted-foreground">{incident.actionsTaken}</p>
                </div>
              )}

              {incident.followUpRequired && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-medium">Follow-up Required</span>
                    {incident.followUpNotes && (
                      <p className="mt-1 text-sm">{incident.followUpNotes}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Review Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="reviewNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supervisor Review Notes *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Document your review, assessment, and any additional actions or recommendations..."
                          className="min-h-[120px]"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide your assessment and any additional guidance or follow-up actions needed
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
                    {isLoading ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
