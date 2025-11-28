import { z } from 'zod'

export const createShiftSchema = z.object({
  name: z.string().min(1, 'Shift name is required').max(100, 'Name too long'),
  startTime: z.preprocess((val) => (val instanceof Date ? val : new Date(val as string)), z.date()),
  endTime: z.preprocess((val) => (val instanceof Date ? val : new Date(val as string)), z.date()),
  locationId: z.string().cuid('Invalid location ID'),
  supervisorId: z.string().cuid('Invalid supervisor ID').optional(),
}).refine((data) => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

export const updateShiftSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startTime: z.preprocess((val) => (val instanceof Date ? val : new Date(val as string)), z.date()).optional(),
  endTime: z.preprocess((val) => (val instanceof Date ? val : new Date(val as string)), z.date()).optional(),
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

// Fix type inference for preprocessed dates in Zod v4
export type CreateShiftInput = Omit<z.infer<typeof createShiftSchema>, 'startTime' | 'endTime'> & {
  startTime: Date
  endTime: Date
}
export type UpdateShiftInput = Omit<z.infer<typeof updateShiftSchema>, 'startTime' | 'endTime'> & {
  startTime?: Date
  endTime?: Date
}
