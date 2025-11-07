import { z } from 'zod'
import { createLogSchema, RecordStatusEnum } from './log'

export const IncidentSeverityEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
])

export const createIncidentReportSchema = createLogSchema.extend({
  // Force type to be INCIDENT
  type: z.literal('INCIDENT'),

  // Override status to be required (not optional with default)
  status: RecordStatusEnum,

  // Incident-specific required fields
  severity: IncidentSeverityEnum,
  incidentTime: z.date(),

  // Optional incident fields
  peopleInvolved: z.string().optional(),
  witnesses: z.string().optional(),
  actionsTaken: z.string().min(1, 'Please describe actions taken').optional(),
  followUpRequired: z.boolean(),
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
  videoUrls: z.string().optional().nullable(),

  // Incident fields
  severity: IncidentSeverityEnum.optional(),
  incidentTime: z.coerce.date().optional(),
  peopleInvolved: z.string().optional().nullable(),
  witnesses: z.string().optional().nullable(),
  actionsTaken: z.string().optional().nullable(),
  followUpRequired: z.boolean().optional(),
  followUpNotes: z.string().optional().nullable(),
  weatherConditions: z.string().max(200).optional().nullable(),
})

export type CreateIncidentReportInput = z.infer<typeof createIncidentReportSchema>
export type UpdateIncidentReportInput = z.infer<typeof updateIncidentReportSchema>
export type IncidentSeverity = z.infer<typeof IncidentSeverityEnum>
