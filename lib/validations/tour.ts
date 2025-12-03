import { z } from 'zod'

export const startTourSchema = z.object({
  carNumber: z.string()
    .min(1, 'Car number is required')
    .max(50, 'Car number too long'),
  radioNumber: z.string()
    .min(1, 'Radio number is required')
    .max(50, 'Radio number too long'),
  startingMileage: z.number()
    .int('Mileage must be a whole number')
    .min(0, 'Mileage cannot be negative')
    .max(999999, 'Mileage value too large'),
  title: z.string()
    .max(255, 'Title too long')
    .optional()
})

export const completeTourSchema = z.object({
  endingMileage: z.number()
    .int('Mileage must be a whole number')
    .min(0, 'Mileage cannot be negative')
    .max(999999, 'Mileage value too large'),
  carReturned: z.boolean(),
  radioReturned: z.boolean(),
  keysReturned: z.boolean(),
  notes: z.string()
    .max(5000, 'Notes too long')
    .optional()
})

export const createTourStopSchema = z.object({
  tourId: z.string().cuid(),
  locationId: z.string().cuid().optional(),
  stopType: z.enum(['LOCATION_INSPECTION', 'GUARD_EVALUATION', 'INCIDENT_CHECK', 'GENERAL_OBSERVATION']),
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title too long'),
  observations: z.string()
    .min(1, 'Observations are required')
    .max(10000, 'Observations too long'),
  photoUrls: z.array(z.string().url()).optional(),
  guardUserId: z.string().cuid().optional(),
  guardPerformanceNotes: z.string()
    .max(5000, 'Performance notes too long')
    .optional(),
  issuesSeverity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  followUpRequired: z.boolean().optional()
})
