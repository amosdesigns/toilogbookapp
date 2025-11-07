'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { canManageShifts } from '@/lib/utils/auth'
import { z } from 'zod'

const reviewIncidentSchema = z.object({
  incidentId: z.string().cuid(),
  reviewNotes: z.string().min(1, 'Review notes are required'),
})

/**
 * Get all unreviewed incidents
 * Only accessible to supervisors and above
 * Sorted by severity (CRITICAL → HIGH → MEDIUM → LOW)
 */
export async function getUnreviewedIncidents() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Check if user is supervisor or above
    if (!canManageShifts(user.role)) {
      return {
        success: false,
        error: 'Only supervisors can view unreviewed incidents'
      }
    }

    // Get unreviewed incidents, sorted by severity
    const incidents = await prisma.log.findMany({
      where: {
        type: 'INCIDENT',
        reviewedBy: null,
        severity: {
          in: ['CRITICAL', 'HIGH', 'MEDIUM'],
        },
      },
      include: {
        location: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        shift: true,
      },
      orderBy: [
        {
          severity: 'desc', // CRITICAL first
        },
        {
          createdAt: 'desc',
        },
      ],
    })

    return {
      success: true,
      incidents
    }
  } catch (error) {
    console.error('[GET_UNREVIEWED_INCIDENTS_ACTION]', error)
    return {
      success: false,
      error: 'Failed to fetch unreviewed incidents'
    }
  }
}

/**
 * Review an incident (add supervisor review notes)
 * Only accessible to supervisors and above
 */
export async function reviewIncident(data: z.infer<typeof reviewIncidentSchema>) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const validatedData = reviewIncidentSchema.parse(data)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Check if user is supervisor or above
    if (!canManageShifts(user.role)) {
      return {
        success: false,
        error: 'Only supervisors can review incidents'
      }
    }

    // Verify incident exists and is of type INCIDENT
    const incident = await prisma.log.findUnique({
      where: { id: validatedData.incidentId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!incident) {
      return { success: false, error: 'Incident not found' }
    }

    if (incident.type !== 'INCIDENT') {
      return { success: false, error: 'This log entry is not an incident' }
    }

    if (incident.reviewedBy) {
      return {
        success: false,
        error: 'This incident has already been reviewed'
      }
    }

    // Update incident with review
    const reviewedIncident = await prisma.log.update({
      where: { id: validatedData.incidentId },
      data: {
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewNotes: validatedData.reviewNotes,
      },
      include: {
        location: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Revalidate relevant paths
    revalidatePath('/admin/dashboard')
    revalidatePath('/logs')

    return {
      success: true,
      incident: reviewedIncident,
      message: `Incident reviewed successfully`
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        issues: error.issues
      }
    }

    console.error('[REVIEW_INCIDENT_ACTION]', error)
    return {
      success: false,
      error: 'Failed to review incident'
    }
  }
}

/**
 * Get incidents by status (for dashboard filtering)
 * Only accessible to supervisors and above
 */
export async function getIncidentsByStatus(status: 'all' | 'unreviewed' | 'live' | 'updated' | 'archived') {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Check if user is supervisor or above
    if (!canManageShifts(user.role)) {
      return {
        success: false,
        error: 'Only supervisors can view incidents'
      }
    }

    // Build where clause based on status
    const where: any = {
      type: 'INCIDENT',
    }

    if (status === 'unreviewed') {
      where.reviewedBy = null
    } else if (status === 'live') {
      where.status = 'LIVE'
    } else if (status === 'updated') {
      where.status = 'UPDATED'
    } else if (status === 'archived') {
      where.status = 'ARCHIVED'
    }
    // 'all' means no additional filters

    const incidents = await prisma.log.findMany({
      where,
      include: {
        location: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        shift: true,
      },
      orderBy: [
        {
          severity: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    })

    return {
      success: true,
      incidents
    }
  } catch (error) {
    console.error('[GET_INCIDENTS_BY_STATUS_ACTION]', error)
    return {
      success: false,
      error: 'Failed to fetch incidents'
    }
  }
}
