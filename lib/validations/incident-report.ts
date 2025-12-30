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

/**
 * Validation schema for incident report PDF generation form
 * Used when generating printable incident reports from logs
 */
export const incidentReportFormSchema = z.object({
  // Report identification
  incidentNumber: z.string().min(1, "Incident number is required"),
  incidentTime: z.string().min(1, "Incident time is required"),

  // Dates
  reportDate: z.string().min(1, "Report date is required"),
  incidentDate: z.string().min(1, "Incident date is required"),

  // Location and personnel
  location: z.string().min(1, "Location is required"),
  guardOnDuty: z.string().min(1, "Guard on duty is required"),
  supervisorOnDuty: z.string().min(1, "Supervisor on duty is required"),
  whoWasNotified: z.string().optional(),

  // Incident details
  incidentDescription: z
    .string()
    .min(50, "Incident description must be at least 50 characters")
    .max(5000, "Incident description must be less than 5000 characters"),

  actionsTaken: z
    .string()
    .min(20, "Actions taken must be at least 20 characters")
    .max(5000, "Actions taken must be less than 5000 characters"),

  followUp: z.string().max(2000, "Follow up must be less than 2000 characters").optional(),

  // Notification recipients - array of user IDs
  notifyUsers: z.array(z.string()).optional().default([]),
})

export type IncidentReportFormData = z.infer<typeof incidentReportFormSchema>

/**
 * Helper to generate incident number from log ID
 * Format: INC-YYYY-{logId}
 * Deterministic based on log ID
 */
export function generateIncidentNumber(logId: string): string {
  const year = new Date().getFullYear()
  return `INC-${year}-${logId}`
}
