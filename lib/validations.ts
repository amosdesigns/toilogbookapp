import { z } from "zod"
import { IncidentSeverityEnum, RecordStatusEnum } from "./enums";

export const createIncidentReportSchema = z.object({
  type: z.literal("INCIDENT"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  locationId: z.string().cuid("Invalid location ID"),
  shiftId: z.string().cuid().optional(),
  severity: IncidentSeverityEnum,
  incidentTime: z.coerce.date(), // Change from z.date() or z.unknown()
  peopleInvolved: z.string().optional(),
  witnesses: z.string().optional(),
  actionsTaken: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpNotes: z.string().optional(),
  weatherConditions: z.string().optional(),
  status: RecordStatusEnum, // Remove .optional() if it has it
})

export type CreateIncidentReportInput = z.infer<typeof createIncidentReportSchema>
export const RecordStatusEnum = z.enum(["LIVE", "UPDATED", "ARCHIVED", "DRAFT"])
export const IncidentSeverityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
