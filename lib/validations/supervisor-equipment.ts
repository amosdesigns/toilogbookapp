import { z } from "zod"

// Enum for equipment types
export const SupervisorEquipmentTypeSchema = z.enum(["CAR", "RADIO"])

// Create equipment schema
export const createEquipmentSchema = z.object({
  type: SupervisorEquipmentTypeSchema,
  identifier: z.string().min(1, "Identifier is required").max(50, "Identifier must be 50 characters or less"),
})

// Checkout equipment schema
export const checkoutEquipmentSchema = z.object({
  dutySessionId: z.string().cuid("Invalid duty session ID"),
  carId: z.string().cuid("Invalid car ID"),
  radioId: z.string().cuid("Invalid radio ID"),
  checkoutMileage: z.number().int().positive("Mileage must be a positive number"),
})

// Checkin equipment schema
export const checkinEquipmentSchema = z.object({
  dutySessionId: z.string().cuid("Invalid duty session ID"),
  checkinMileage: z.number().int().positive("Mileage must be a positive number"),
  notes: z.string().optional(),
})

// Types derived from schemas
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>
export type CheckoutEquipmentInput = z.infer<typeof checkoutEquipmentSchema>
export type CheckinEquipmentInput = z.infer<typeof checkinEquipmentSchema>
