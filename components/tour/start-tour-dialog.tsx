"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck, AlertTriangle, Loader2 } from "lucide-react"
import { startTour } from "@/lib/actions/tour-actions"
import { startTourSchema } from "@/lib/validations/tour"
import { toast } from "sonner"

type StartTourFormData = z.infer<typeof startTourSchema>

interface StartTourDialogProps {
  trigger?: React.ReactNode
}

export function StartTourDialog({ trigger }: StartTourDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)

  const form = useForm<StartTourFormData>({
    resolver: zodResolver(startTourSchema),
    defaultValues: {
      carNumber: "",
      radioNumber: "",
      startingMileage: 0,
      title: "",
    },
  })

  const onSubmit = async (data: StartTourFormData) => {
    try {
      setIsLoading(true)
      setWarning(null)

      const result = await startTour(data)

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      // Check for incomplete tour warning
      if (result.meta?.incompleteTourWarning) {
        setWarning(result.meta.incompleteTourWarning as string)
      }

      toast.success(result.message || "Tour started successfully")
      form.reset()
      setOpen(false)

      // Redirect to tour detail page
      if (result.data) {
        router.push(`/admin/tours/${result.data.id}`)
      }
    } catch (error) {
      toast.error("An error occurred while starting the tour")
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
            <ShieldCheck className="h-4 w-4 mr-2" />
            Start Tour
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start Tour</DialogTitle>
          <DialogDescription>
            Begin your tour by checking out equipment and recording starting mileage.
          </DialogDescription>
        </DialogHeader>

        {warning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{warning}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tour Title (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Morning Marina Rounds" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Car Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CAR-123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="radioNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Radio Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., RADIO-45" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startingMileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Mileage *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 12500"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                Start Tour
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
