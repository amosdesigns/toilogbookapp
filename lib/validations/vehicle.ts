import { z } from 'zod'

export const vehicleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  make: z.string().min(1, 'Make is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  vin: z.string().max(17).optional().nullable(),
  licensePlate: z.string().max(20).optional().nullable(),
  mileage: z.number().int().min(0),
  status: z.enum(['WORKING', 'OUT_OF_SERVICE', 'RETIRED']),
  locationId: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateVehicleSchema = vehicleSchema.extend({
  mileageUpdatedAt: z.date().optional().nullable(),
})

export type VehicleFormData = z.infer<typeof vehicleSchema>
export type UpdateVehicleFormData = z.infer<typeof updateVehicleSchema>
