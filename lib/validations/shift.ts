import { z } from 'zod'

export const createShiftSchema = z.object({
  name: z.string().min(1, 'Shift name is required').max(100, 'Name too long'),
  startTime: z.date(),
  endTime: z.date(),
  locationId: z.string().cuid('Invalid location ID'),
  supervisorId: z.string().cuid('Invalid supervisor ID').optional(),
}).refine((data) => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

export const updateShiftSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  locationId: z.string().cuid().optional(),
  supervisorId: z.string().cuid().optional().nullable(),
}).refine((data) => {
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime
  }
  return true
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

export type CreateShiftInput = z.infer<typeof createShiftSchema>
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>
