'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const clockInSchema = z.object({
  locationId: z.string().cuid().optional().nullable(), // null for supervisors (roaming)
  shiftId: z.string().cuid().optional(),
})

const clockOutSchema = z.object({
  dutySessionId: z.string().cuid(),
  notes: z.string().optional(),
})

/**
 * Clock in to start a duty session
 * Guards must select a location, supervisors start roaming duty
 */
export async function clockIn(data: z.infer<typeof clockInSchema>) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const validatedData = clockInSchema.parse(data)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Check if user already has an active duty session
    const existingSession = await prisma.dutySession.findFirst({
      where: {
        userId: user.id,
        clockOutTime: null,
      },
    })

    if (existingSession) {
      return {
        success: false,
        error: 'Already on duty. Please sign off first.'
      }
    }

    // Validate locationId for guards
    if (user.role === 'GUARD' && !validatedData.locationId) {
      return {
        success: false,
        error: 'Guards must select a location'
      }
    }

    // Supervisors should have null locationId (roaming)
    let finalLocationId = validatedData.locationId
    if (
      (user.role === 'SUPERVISOR' ||
       user.role === 'ADMIN' ||
       user.role === 'SUPER_ADMIN') &&
      validatedData.locationId
    ) {
      finalLocationId = null // Force null for roaming duty
    }

    // Create duty session
    const dutySession = await prisma.dutySession.create({
      data: {
        userId: user.id,
        locationId: finalLocationId,
        shiftId: validatedData.shiftId,
      },
      include: {
        location: true,
        shift: true,
      },
    })

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      dutySession,
      message: 'Successfully clocked in'
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        issues: error.issues
      }
    }

    console.error('[CLOCK_IN_ACTION]', error)
    return {
      success: false,
      error: 'Failed to clock in. Please try again.'
    }
  }
}

/**
 * Clock out to end a duty session
 */
export async function clockOut(data: z.infer<typeof clockOutSchema>) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const validatedData = clockOutSchema.parse(data)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Verify the duty session belongs to this user
    const dutySession = await prisma.dutySession.findUnique({
      where: { id: validatedData.dutySessionId },
    })

    if (!dutySession) {
      return { success: false, error: 'Duty session not found' }
    }

    if (dutySession.userId !== user.id) {
      return { success: false, error: 'Unauthorized to modify this session' }
    }

    if (dutySession.clockOutTime) {
      return { success: false, error: 'Already clocked out' }
    }

    // Update duty session
    const updatedSession = await prisma.dutySession.update({
      where: { id: validatedData.dutySessionId },
      data: {
        clockOutTime: new Date(),
        notes: validatedData.notes,
      },
      include: {
        location: true,
        shift: true,
      },
    })

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      dutySession: updatedSession,
      message: 'Successfully clocked out'
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        issues: error.issues
      }
    }

    console.error('[CLOCK_OUT_ACTION]', error)
    return {
      success: false,
      error: 'Failed to clock out. Please try again.'
    }
  }
}

/**
 * Get current active duty session for the logged-in user
 */
export async function getCurrentDutySession() {
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

    // Get active duty session (clockOutTime is null)
    const activeDutySession = await prisma.dutySession.findFirst({
      where: {
        userId: user.id,
        clockOutTime: null,
      },
      include: {
        location: true,
        shift: true,
        locationCheckIns: {
          include: {
            location: true,
          },
          orderBy: {
            checkInTime: 'desc',
          },
        },
      },
    })

    return {
      success: true,
      dutySession: activeDutySession
    }
  } catch (error) {
    console.error('[GET_CURRENT_DUTY_SESSION_ACTION]', error)
    return {
      success: false,
      error: 'Failed to fetch duty session'
    }
  }
}

/**
 * Get a specific duty session by ID
 */
export async function getDutySession(dutySessionId: string) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const session = await prisma.dutySession.findUnique({
      where: { id: dutySessionId },
      include: {
        shift: true,
        location: true,
        locationCheckIns: {
          include: {
            location: true,
          },
          orderBy: {
            checkInTime: 'desc',
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    })

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    return {
      success: true,
      dutySession: session
    }
  } catch (error) {
    console.error('[GET_DUTY_SESSION_ACTION]', error)
    return {
      success: false,
      error: 'Failed to fetch duty session'
    }
  }
}
