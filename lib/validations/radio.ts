import { z } from 'zod'

export const radioSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  serialNumber: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  channel: z.string().max(50).optional().nullable(),
  status: z.enum(['WORKING', 'OUT_OF_SERVICE', 'RETIRED']),
  locationId: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export type RadioFormData = z.infer<typeof radioSchema>
