'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { canManageShifts } from '@/lib/utils/auth'
import { z } from 'zod'

const createLocationCheckInSchema = z.object({
  locationId: z.string().cuid(),
  notes: z.string().optional(),
})

/**
 * Check in to a location during roaming duty
 * Only accessible to supervisors and above
 */
export async function checkInToLocation(data: z.infer<typeof createLocationCheckInSchema>) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const validatedData = createLocationCheckInSchema.parse(data)

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
        error: 'Only supervisors can check in to locations'
      }
    }

    // Get active duty session
    const activeDutySession = await prisma.dutySession.findFirst({
      where: {
        userId: user.id,
        clockOutTime: null,
      },
    })

    if (!activeDutySession) {
      return {
        success: false,
        error: 'You must be on duty to check in to a location'
      }
    }

    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: validatedData.locationId },
    })

    if (!location) {
      return { success: false, error: 'Location not found' }
    }

    if (!location.isActive) {
      return { success: false, error: 'This location is not active' }
    }

    // Create location check-in
    const checkIn = await prisma.locationCheckIn.create({
      data: {
        dutySessionId: activeDutySession.id,
        locationId: validatedData.locationId,
        userId: user.id,
        notes: validatedData.notes,
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
      },
    })

    // Revalidate relevant paths
    revalidatePath('/admin/dashboard')
    revalidatePath('/dashboard')

    return {
      success: true,
      checkIn,
      message: `Checked in to ${location.name}`
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        issues: error.issues
      }
    }

    console.error('[CHECK_IN_TO_LOCATION_ACTION]', error)
    return {
      success: false,
      error: 'Failed to check in to location'
    }
  }
}

/**
 * Get location check-ins with optional filters
 * Guards can only see their own, supervisors see all
 */
export async function getLocationCheckIns(filters?: {
  dutySessionId?: string
  locationId?: string
}) {
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

    // Build where clause
    const where: any = {}

    if (filters?.dutySessionId) {
      where.dutySessionId = filters.dutySessionId
    }

    if (filters?.locationId) {
      where.locationId = filters.locationId
    }

    // Guards can only see their own check-ins
    // Supervisors and above can see all
    if (user.role === 'GUARD') {
      where.userId = user.id
    }

    const checkIns = await prisma.locationCheckIn.findMany({
      where,
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
        dutySession: {
          select: {
            id: true,
            clockInTime: true,
            clockOutTime: true,
          },
        },
      },
      orderBy: {
        checkInTime: 'desc',
      },
    })

    return {
      success: true,
      checkIns
    }
  } catch (error) {
    console.error('[GET_LOCATION_CHECKINS_ACTION]', error)
    return {
      success: false,
      error: 'Failed to fetch location check-ins'
    }
  }
}

/**
 * Get recent check-ins for the current user's active duty session
 */
export async function getMyRecentCheckIns(limit: number = 5) {
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

    // Get active duty session
    const activeDutySession = await prisma.dutySession.findFirst({
      where: {
        userId: user.id,
        clockOutTime: null,
      },
    })

    if (!activeDutySession) {
      return {
        success: true,
        checkIns: [] // No active session, return empty array
      }
    }

    // Get recent check-ins for this duty session
    const checkIns = await prisma.locationCheckIn.findMany({
      where: {
        dutySessionId: activeDutySession.id,
      },
      include: {
        location: true,
      },
      orderBy: {
        checkInTime: 'desc',
      },
      take: limit,
    })

    return {
      success: true,
      checkIns
    }
  } catch (error) {
    console.error('[GET_MY_RECENT_CHECKINS_ACTION]', error)
    return {
      success: false,
      error: 'Failed to fetch recent check-ins'
    }
  }
}
