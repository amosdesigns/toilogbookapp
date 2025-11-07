'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Get current user's profile with statistics
 */
export async function getMyProfile() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        _count: {
          select: {
            logs: true,
            dutySessions: true,
            locationCheckIns: true,
          },
        },
      },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Calculate total duty hours
    const dutySessions = await prisma.dutySession.findMany({
      where: {
        userId: user.id,
        clockOutTime: { not: null },
      },
      select: {
        clockInTime: true,
        clockOutTime: true,
      },
    })

    let totalHours = 0
    dutySessions.forEach((session) => {
      if (session.clockOutTime) {
        const diff = new Date(session.clockOutTime).getTime() - new Date(session.clockInTime).getTime()
        totalHours += diff / (1000 * 60 * 60) // Convert to hours
      }
    })

    return {
      success: true,
      profile: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        stats: {
          totalLogs: user._count.logs,
          totalDutySessions: user._count.dutySessions,
          totalLocationCheckIns: user._count.locationCheckIns,
          totalDutyHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
        },
      },
    }
  } catch (error) {
    console.error('[GET_MY_PROFILE_ACTION]', error)
    return {
      success: false,
      error: 'Failed to fetch profile',
    }
  }
}

/**
 * Get user's recent duty sessions
 */
export async function getMyDutySessions(limit: number = 10) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const dutySessions = await prisma.dutySession.findMany({
      where: { userId: user.id },
      include: {
        location: true,
        shift: true,
      },
      orderBy: {
        clockInTime: 'desc',
      },
      take: limit,
    })

    // Calculate duration for each session
    const sessionsWithDuration = dutySessions.map((session) => {
      let duration = 'Active'
      if (session.clockOutTime) {
        const diff = new Date(session.clockOutTime).getTime() - new Date(session.clockInTime).getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        duration = `${hours}h ${minutes}m`
      }
      return {
        ...session,
        duration,
      }
    })

    return {
      success: true,
      dutySessions: sessionsWithDuration,
    }
  } catch (error) {
    console.error('[GET_MY_DUTY_SESSIONS_ACTION]', error)
    return {
      success: false,
      error: 'Failed to fetch duty sessions',
    }
  }
}

/**
 * Get user's recent logs
 */
export async function getMyLogs(limit: number = 10) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const logs = await prisma.log.findMany({
      where: {
        userId: user.id,
        archivedAt: null,
      },
      include: {
        location: true,
        shift: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return {
      success: true,
      logs,
    }
  } catch (error) {
    console.error('[GET_MY_LOGS_ACTION]', error)
    return {
      success: false,
      error: 'Failed to fetch logs',
    }
  }
}

/**
 * Update user profile information
 */
export async function updateMyProfile(data: {
  firstName?: string
  lastName?: string
}) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Update in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
    })

    // Revalidate profile page
    revalidatePath('/profile')
    revalidatePath('/admin/profile')

    return {
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully',
    }
  } catch (error) {
    console.error('[UPDATE_MY_PROFILE_ACTION]', error)
    return {
      success: false,
      error: 'Failed to update profile',
    }
  }
}
