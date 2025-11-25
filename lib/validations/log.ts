import { z } from 'zod'

export const LogTypeEnum = z.enum([
  'INCIDENT',
  'PATROL',
  'VISITOR_CHECKIN',
  'MAINTENANCE',
  'WEATHER',
  'OTHER',
])

export const RecordStatusEnum = z.enum([
  'LIVE',
  'UPDATED',
  'ARCHIVED',
  'DRAFT',
])

export const createLogSchema = z.object({
  type: LogTypeEnum,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  locationId: z.string().cuid('Invalid location ID'),
  shiftId: z.string().cuid('Invalid shift ID').optional(),
  status: RecordStatusEnum,
})

export const updateLogSchema = z.object({
  type: LogTypeEnum.optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  locationId: z.string().cuid().optional(),
  shiftId: z.string().cuid().optional().nullable(),
  status: RecordStatusEnum.optional(),
})

export type CreateLogInput = z.infer<typeof createLogSchema>
export type UpdateLogInput = z.infer<typeof updateLogSchema>
