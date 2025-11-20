'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Get all guards currently on duty (active duty sessions)
 * Only accessible to supervisors and above
 */
export async function getGuardsOnDuty() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!currentUser) {
      return { success: false, error: 'User not found' }
    }

    // Only supervisors and above can view guards on duty
    if (!['SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return {
        success: false,
        error: 'Only supervisors and above can view guards on duty'
      }
    }

    // Find all active duty sessions (clockOutTime is null)
    const activeDutySessions = await prisma.dutySession.findMany({
      where: {
        clockOutTime: null,
      },
      include: {
        user: true,
        location: true,
      },
      orderBy: {
        clockInTime: 'asc',
      },
    })

    // Calculate hours on duty and format data
    const guards = activeDutySessions.map((session: typeof activeDutySessions[0]) => {
      const now = new Date()
      const start = new Date(session.clockInTime)
      const diff = now.getTime() - start.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      return {
        id: session.id,
        userId: session.user.id,
        name: `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim(),
        email: session.user.email,
        role: session.user.role,
        locationId: session.locationId,
        locationName: session.location?.name || 'Roaming', // Handle null location (supervisors)
        clockInTime: session.clockInTime,
        hoursOnDuty: `${hours}h ${minutes}m`,
        hoursNumeric: hours + minutes / 60, // For sorting/filtering
      }
    })

    return {
      success: true,
      guards
    }
  } catch (error) {
    console.error('[GET_GUARDS_ON_DUTY_ACTION]', error)
    return {
      success: false,
      error: 'Failed to fetch guards on duty'
    }
  }
}

/**
 * Force clock out a guard (supervisor override)
 * Only accessible to supervisors and above
 */
export async function forceClockOut(dutySessionId: string, notes?: string) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!currentUser) {
      return { success: false, error: 'User not found' }
    }

    // Only supervisors and above can force clock out
    if (!['SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return {
        success: false,
        error: 'Only supervisors and above can force clock out'
      }
    }

    // Get the duty session
    const dutySession = await prisma.dutySession.findUnique({
      where: { id: dutySessionId },
      include: {
        user: true,
      },
    })

    if (!dutySession) {
      return { success: false, error: 'Duty session not found' }
    }

    if (dutySession.clockOutTime) {
      return { success: false, error: 'Already clocked out' }
    }

    // Update duty session
    const updatedSession = await prisma.dutySession.update({
      where: { id: dutySessionId },
      data: {
        clockOutTime: new Date(),
        notes: notes || `Force clocked out by ${currentUser.firstName} ${currentUser.lastName}`,
      },
    })

    // Revalidate relevant paths
    revalidatePath('/admin/dashboard')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: `Successfully clocked out ${dutySession.user.firstName} ${dutySession.user.lastName}`,
      dutySession: updatedSession
    }
  } catch (error) {
    console.error('[FORCE_CLOCK_OUT_ACTION]', error)
    return {
      success: false,
      error: 'Failed to force clock out'
    }
  }
}
