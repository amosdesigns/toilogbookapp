'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

/**
 * Get logs with optional filters
 */
export async function getLogs(filters?: {
  type?: string
  status?: string
  locationId?: string
  userId?: string
  limit?: number
}) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Build where clause
    const where: any = {}

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.locationId) {
      where.locationId = filters.locationId
    }

    if (filters?.userId) {
      where.userId = filters.userId
    }

    // Exclude archived logs by default
    if (!filters?.status) {
      where.archivedAt = null
    }

    const logs = await prisma.log.findMany({
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
        shift: true,
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || undefined,
    })

    return {
      success: true,
      logs
    }
  } catch (error) {
    console.error('[GET_LOGS_ACTION]', error)
    return {
      success: false,
      error: 'Failed to fetch logs'
    }
  }
}

/**
 * Get a specific log by ID
 */
export async function getLog(logId: string) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const log = await prisma.log.findUnique({
      where: { id: logId },
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

    if (!log) {
      return { success: false, error: 'Log not found' }
    }

    return {
      success: true,
      log
    }
  } catch (error) {
    console.error('[GET_LOG_ACTION]', error)
    return {
      success: false,
      error: 'Failed to fetch log'
    }
  }
}

/**
 * Create a new log entry
 */
export async function createLog(data: any) {
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

    // Create log
    const log = await prisma.log.create({
      data: {
        ...data,
        userId: user.id,
      },
      include: {
        location: true,
        shift: true,
      },
    })

    // Revalidate relevant paths
    revalidatePath('/logs')
    revalidatePath('/admin/logs')
    revalidatePath('/dashboard')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      log,
      message: 'Log created successfully'
    }
  } catch (error) {
    console.error('[CREATE_LOG_ACTION]', error)
    return {
      success: false,
      error: 'Failed to create log'
    }
  }
}

/**
 * Update a log entry
 */
export async function updateLog(logId: string, data: any) {
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

    // Get the log to check ownership
    const existingLog = await prisma.log.findUnique({
      where: { id: logId },
    })

    if (!existingLog) {
      return { success: false, error: 'Log not found' }
    }

    // Check permissions (user owns log or is supervisor+)
    const canEdit = existingLog.userId === user.id ||
                    ['SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)

    if (!canEdit) {
      return { success: false, error: 'Unauthorized to edit this log' }
    }

    // Update log
    const log = await prisma.log.update({
      where: { id: logId },
      data,
      include: {
        location: true,
        shift: true,
      },
    })

    // Revalidate relevant paths
    revalidatePath('/logs')
    revalidatePath('/admin/logs')
    revalidatePath('/dashboard')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      log,
      message: 'Log updated successfully'
    }
  } catch (error) {
    console.error('[UPDATE_LOG_ACTION]', error)
    return {
      success: false,
      error: 'Failed to update log'
    }
  }
}

/**
 * Delete (archive) a log entry
 */
export async function deleteLog(logId: string) {
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

    // Get the log to check ownership
    const existingLog = await prisma.log.findUnique({
      where: { id: logId },
    })

    if (!existingLog) {
      return { success: false, error: 'Log not found' }
    }

    // Check permissions
    const canDelete = existingLog.userId === user.id ||
                      ['SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)

    if (!canDelete) {
      return { success: false, error: 'Unauthorized to delete this log' }
    }

    // Soft delete (archive) or hard delete for super admin
    if (user.role === 'SUPER_ADMIN') {
      await prisma.log.delete({
        where: { id: logId },
      })
    } else {
      await prisma.log.update({
        where: { id: logId },
        data: {
          archivedAt: new Date(),
          status: 'ARCHIVED',
        },
      })
    }

    // Revalidate relevant paths
    revalidatePath('/logs')
    revalidatePath('/admin/logs')
    revalidatePath('/dashboard')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      message: 'Log deleted successfully'
    }
  } catch (error) {
    console.error('[DELETE_LOG_ACTION]', error)
    return {
      success: false,
      error: 'Failed to delete log'
    }
  }
}
