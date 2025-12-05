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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Car, Radio, Loader2 } from "lucide-react"
import type { SupervisorEquipmentCheckout, SupervisorEquipment } from "@prisma/client"

const supervisorClockOutSchema = z.object({
  checkinMileage: z.string().min(1, "Mileage is required"),
})

type SupervisorClockOutFormData = z.infer<typeof supervisorClockOutSchema>

type EquipmentCheckoutWithEquipment = SupervisorEquipmentCheckout & {
  equipment: SupervisorEquipment
}

interface SupervisorClockOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { checkinMileage: number }) => Promise<void>
  equipmentCheckouts: EquipmentCheckoutWithEquipment[]
  isLoading?: boolean
}

export function SupervisorClockOutDialog({
  open,
  onOpenChange,
  onSubmit,
  equipmentCheckouts,
  isLoading = false,
}: SupervisorClockOutDialogProps) {
  const [error, setError] = useState<string | null>(null)

  // Find car and radio from checkouts
  const carCheckout = equipmentCheckouts.find((c) => c.equipment.type === "CAR")
  const radioCheckout = equipmentCheckouts.find((c) => c.equipment.type === "RADIO")

  const form = useForm<SupervisorClockOutFormData>({
    resolver: zodResolver(supervisorClockOutSchema),
    defaultValues: {
      checkinMileage: "",
    },
  })

  const handleSubmit = async (data: SupervisorClockOutFormData) => {
    try {
      setError(null)

      // Parse mileage to number
      const mileage = parseInt(data.checkinMileage, 10)
      if (isNaN(mileage) || mileage <= 0) {
        setError("Please enter a valid mileage")
        return
      }

      // Validate ending mileage is >= starting mileage
      if (carCheckout && carCheckout.checkoutMileage) {
        if (mileage < carCheckout.checkoutMileage) {
          setError(
            `Ending mileage (${mileage}) cannot be less than starting mileage (${carCheckout.checkoutMileage})`
          )
          return
        }
      }

      await onSubmit({
        checkinMileage: mileage,
      })

      form.reset()
      onOpenChange(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to clock out"
      setError(message)
    }
  }

  const milesDriven =
    carCheckout && carCheckout.checkoutMileage
      ? parseInt(form.watch("checkinMileage") || "0", 10) - carCheckout.checkoutMileage
      : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sign Off Duty</DialogTitle>
          <DialogDescription>
            Return equipment and answer the following questions
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Question 1: Returning Car */}
            {carCheckout && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <Car className="h-5 w-5" />
                  <span>1. Returning Car: {carCheckout.equipment.identifier}</span>
                </div>
                <p className="text-sm text-muted-foreground pl-7">
                  Starting mileage: {carCheckout.checkoutMileage?.toLocaleString()} miles
                </p>
              </div>
            )}

            {/* Question 2: Mileage Input */}
            <FormField
              control={form.control}
              name="checkinMileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">2. What is the mileage?</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter ending odometer reading"
                      className="h-11"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  {milesDriven > 0 && (
                    <FormDescription className="text-green-600 font-medium">
                      Miles driven: {milesDriven.toLocaleString()} miles
                    </FormDescription>
                  )}
                  {milesDriven < 0 && (
                    <FormDescription className="text-destructive">
                      Ending mileage must be greater than starting mileage
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question 3: Returning Radio */}
            {radioCheckout && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <Radio className="h-5 w-5" />
                  <span>3. Returning Radio: {radioCheckout.equipment.identifier}</span>
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
              <Button type="submit" disabled={isLoading || milesDriven < 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Clocking Out...
                  </>
                ) : (
                  "Sign Off Duty"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
