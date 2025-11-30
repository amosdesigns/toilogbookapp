import { z } from 'zod'

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  address: z.string().max(300, 'Address too long').optional(),
  maxCapacity: z.number().int().min(1, 'Max capacity must be at least 1').max(50, 'Max capacity too high').optional().nullable(),
  isActive: z.boolean().default(true),
})

export const updateLocationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  maxCapacity: z.number().int().min(1).max(50).optional().nullable(),
  isActive: z.boolean().optional(),
})

// Fix type inference for default values in Zod v4
export type CreateLocationInput = Omit<z.infer<typeof createLocationSchema>, 'isActive'> & {
  isActive: boolean
}
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>
