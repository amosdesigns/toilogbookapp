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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { completeTour } from "@/lib/actions/tour-actions"
import { completeTourSchema } from "@/lib/validations/tour"
import { toast } from "sonner"
import { formatDateTime } from "@/lib/utils"

type CompleteTourFormData = z.infer<typeof completeTourSchema>

interface CompleteTourDialogProps {
  tourId: string
  startingMileage: number
  carNumber: string
  radioNumber: string
  startedAt: Date
  totalStops: number
  locations: string[]
  trigger?: React.ReactNode
}

export function CompleteTourDialog({
  tourId,
  startingMileage,
  carNumber,
  radioNumber,
  startedAt,
  totalStops,
  locations,
  trigger,
}: CompleteTourDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CompleteTourFormData>({
    resolver: zodResolver(completeTourSchema),
    defaultValues: {
      endingMileage: startingMileage,
      carReturned: false,
      radioReturned: false,
      keysReturned: false,
      notes: "",
    },
  })

  const endingMileage = form.watch("endingMileage")
  const carReturned = form.watch("carReturned")
  const radioReturned = form.watch("radioReturned")
  const keysReturned = form.watch("keysReturned")

  const mileageDriven = endingMileage - startingMileage
  const allEquipmentReturned = carReturned && radioReturned && keysReturned

  const onSubmit = async (data: CompleteTourFormData) => {
    try {
      setIsLoading(true)

      const result = await completeTour(tourId, data)

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message || "Tour completed successfully")
      form.reset()
      setOpen(false)

      // Redirect to tours list
      router.push("/admin/tours")
      router.refresh()
    } catch (error) {
      toast.error("An error occurred while completing the tour")
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
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Complete Tour
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Complete Tour</DialogTitle>
          <DialogDescription>
            Return equipment and record ending mileage to finish your tour.
          </DialogDescription>
        </DialogHeader>

        {/* Tour Summary */}
        <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
          <h3 className="font-medium text-sm">Tour Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Started:</span>
              <p className="font-medium">{formatDateTime(startedAt)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Total Stops:</span>
              <p className="font-medium">{totalStops}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Locations Visited:</span>
              <p className="font-medium">{locations.length || "None"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Starting Mileage:</span>
              <p className="font-medium">{startingMileage.toLocaleString()} mi</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="endingMileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ending Mileage *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter ending mileage"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  {mileageDriven >= 0 && (
                    <FormDescription className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {mileageDriven.toLocaleString()} miles driven
                      </Badge>
                    </FormDescription>
                  )}
                  {mileageDriven < 0 && (
                    <FormDescription className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      Ending mileage must be greater than starting mileage
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <p className="text-sm font-medium">Equipment Return *</p>

              <FormField
                control={form.control}
                name="carReturned"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none flex-1">
                      <FormLabel>Car Returned</FormLabel>
                      <FormDescription>
                        Confirmed return of {carNumber}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="radioReturned"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none flex-1">
                      <FormLabel>Radio Returned</FormLabel>
                      <FormDescription>
                        Confirmed return of {radioNumber}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keysReturned"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none flex-1">
                      <FormLabel>Keys Returned</FormLabel>
                      <FormDescription>
                        Confirmed return of vehicle keys
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Final Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes or observations about the tour..."
                      className="min-h-[80px]"
                      {...field}
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
              <Button
                type="submit"
                disabled={isLoading || !allEquipmentReturned || mileageDriven < 0}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Complete Tour
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
