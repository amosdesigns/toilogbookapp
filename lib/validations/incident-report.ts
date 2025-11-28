import { z } from 'zod'
import { createLogSchema } from './log'

export const IncidentSeverityEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
])

export const createIncidentReportSchema = createLogSchema.extend({
  // Force type to be INCIDENT
  type: z.literal('INCIDENT'),

  // Incident-specific required fields
  severity: IncidentSeverityEnum,
  incidentTime: z.preprocess(
    (val) => (val instanceof Date ? val : new Date(val as string)),
    z.date()
  ),

  // Optional incident fields
  peopleInvolved: z.string().optional(),
  witnesses: z.string().optional(),
  actionsTaken: z.string().min(1, 'Please describe actions taken').optional(),
  followUpRequired: z.boolean().default(false),
  followUpNotes: z.string().optional(),
  weatherConditions: z.string().max(200).optional(),
})

export const updateIncidentReportSchema = z.object({
  type: z.literal('INCIDENT').optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  locationId: z.string().cuid().optional(),
  shiftId: z.string().cuid().optional().nullable(),
  status: z.enum(['LIVE', 'UPDATED', 'ARCHIVED', 'DRAFT']).optional(),

  // Incident fields
  severity: IncidentSeverityEnum.optional(),
  incidentTime: z.preprocess(
    (val) => (val instanceof Date ? val : new Date(val as string)),
    z.date()
  ).optional(),
  peopleInvolved: z.string().optional().nullable(),
  witnesses: z.string().optional().nullable(),
  actionsTaken: z.string().optional().nullable(),
  followUpRequired: z.boolean().optional(),
  followUpNotes: z.string().optional().nullable(),
  weatherConditions: z.string().max(200).optional().nullable(),
})

// Manually define types with correct Date type (workaround for Zod v4 preprocess type inference)
export type CreateIncidentReportInput = Omit<z.infer<typeof createIncidentReportSchema>, 'incidentTime' | 'followUpRequired'> & {
  incidentTime: Date
  followUpRequired: boolean
}

export type UpdateIncidentReportInput = Omit<z.infer<typeof updateIncidentReportSchema>, 'incidentTime'> & {
  incidentTime?: Date
}

export type IncidentSeverity = z.infer<typeof IncidentSeverityEnum>
