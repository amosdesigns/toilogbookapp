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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Car, Radio, Loader2 } from "lucide-react"
import { getAvailableEquipment } from "@/lib/actions/supervisor-equipment-actions"
import { toast } from "sonner"
import type { SupervisorEquipment } from "@prisma/client"

const supervisorClockInSchema = z.object({
  carId: z.string().min(1, "Please select a car"),
  checkoutMileage: z.string().min(1, "Mileage is required"),
  radioId: z.string().min(1, "Please select a radio"),
})

type SupervisorClockInFormData = z.infer<typeof supervisorClockInSchema>

interface SupervisorClockInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    carId: string
    radioId: string
    checkoutMileage: number
  }) => Promise<void>
  isLoading?: boolean
}

export function SupervisorClockInDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: SupervisorClockInDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [cars, setCars] = useState<SupervisorEquipment[]>([])
  const [radios, setRadios] = useState<SupervisorEquipment[]>([])
  const [isFetchingEquipment, setIsFetchingEquipment] = useState(false)

  const form = useForm<SupervisorClockInFormData>({
    resolver: zodResolver(supervisorClockInSchema),
    defaultValues: {
      carId: "",
      checkoutMileage: "",
      radioId: "",
    },
  })

  // Fetch available equipment when dialog opens
  useEffect(() => {
    if (open) {
      const fetchEquipment = async () => {
        setIsFetchingEquipment(true)

        const [carsResult, radiosResult] = await Promise.all([
          getAvailableEquipment("CAR"),
          getAvailableEquipment("RADIO"),
        ])

        if (carsResult.ok && carsResult.data) {
          setCars(carsResult.data as SupervisorEquipment[])
        } else {
          toast.error("Failed to load available cars")
        }

        if (radiosResult.ok && radiosResult.data) {
          setRadios(radiosResult.data as SupervisorEquipment[])
        } else {
          toast.error("Failed to load available radios")
        }

        setIsFetchingEquipment(false)
      }

      fetchEquipment()
    }
  }, [open])

  const handleSubmit = async (data: SupervisorClockInFormData) => {
    try {
      setError(null)

      // Validate that equipment is selected
      if (!data.carId) {
        setError("Please select a car")
        return
      }

      if (!data.radioId) {
        setError("Please select a radio")
        return
      }

      // Parse mileage to number
      const mileage = parseInt(data.checkoutMileage, 10)
      if (isNaN(mileage) || mileage <= 0) {
        setError("Please enter a valid mileage")
        return
      }

      await onSubmit({
        carId: data.carId,
        radioId: data.radioId,
        checkoutMileage: mileage,
      })

      form.reset()
      onOpenChange(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to clock in"
      setError(message)
    }
  }

  const canSubmit = !isFetchingEquipment && cars.length > 0 && radios.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report for Duty</DialogTitle>
          <DialogDescription>
            Answer the following questions to check out equipment from HQ
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Question 1: Car Selection */}
            <FormField
              control={form.control}
              name="carId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">1. What car number?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isFetchingEquipment || cars.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select car number" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cars.map((car) => (
                        <SelectItem key={car.id} value={car.id}>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            {car.identifier}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {cars.length === 0 && !isFetchingEquipment && (
                    <FormDescription className="text-destructive">
                      No cars available
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question 2: Mileage Input */}
            <FormField
              control={form.control}
              name="checkoutMileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">2. What is the mileage of that car?</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter odometer reading"
                      className="h-11"
                      {...field}
                      disabled={isFetchingEquipment}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question 3: Radio Selection */}
            <FormField
              control={form.control}
              name="radioId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">3. Which radio are you using?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isFetchingEquipment || radios.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select radio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {radios.map((radio) => (
                        <SelectItem key={radio.id} value={radio.id}>
                          <div className="flex items-center gap-2">
                            <Radio className="h-4 w-4" />
                            {radio.identifier}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {radios.length === 0 && !isFetchingEquipment && (
                    <FormDescription className="text-destructive">
                      No radios available
                    </FormDescription>
                  )}
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
              <Button
                type="submit"
                disabled={isLoading || !canSubmit}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Clocking In...
                  </>
                ) : isFetchingEquipment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Equipment...
                  </>
                ) : (
                  "Check In for Duty"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
