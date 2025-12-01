'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/sync-user'
import { canManageResource } from '@/lib/utils/auth'
import { createLogSchema, updateLogSchema } from '@/lib/validations/log'
import { to, type ActionResult } from '@/lib/utils/RenderError'

interface GetLogsParams {
  locationId?: string
  search?: string
  year?: string
  month?: string
  dayOfWeek?: string
  type?: string
  status?: string
}

export async function getLogs(params: GetLogsParams = {}): Promise<ActionResult<any[]>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    const { locationId, search, year, month, type, status } = params

    // Build the where clause
    const where: any = {
      archivedAt: null, // Don't show archived logs
    }

    if (locationId) {
      where.locationId = locationId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    // Date filters
    if (year || month) {
      const dateConditions: any = {}

      if (year) {
        const yearNum = parseInt(year)
        dateConditions.gte = new Date(yearNum, 0, 1)
        dateConditions.lt = new Date(yearNum + 1, 0, 1)
      }

      if (month && year) {
        const monthNum = parseInt(month)
        const yearNum = parseInt(year)
        dateConditions.gte = new Date(yearNum, monthNum, 1)
        dateConditions.lt = new Date(yearNum, monthNum + 1, 1)
      }

      where.createdAt = dateConditions
    }

    let logs = await prisma.log.findMany({
      where,
      include: {
        location: {
          select: { name: true },
        },
        user: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter by day of week if specified
    if (params.dayOfWeek) {
      const dayNum = parseInt(params.dayOfWeek)
      logs = logs.filter((log) => {
        const date = new Date(log.createdAt)
        return date.getDay() === dayNum
      })
    }

    return { ok: true, data: logs }
  } catch (error) {
    console.error('Error fetching logs:', error)
    return to(error)
  }
}

export async function getLogById(id: string): Promise<ActionResult<any>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    const log = await prisma.log.findUnique({
      where: { id },
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
        shift: true,
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!log) {
      return { ok: false, message: 'Log not found' }
    }

    return { ok: true, data: log }
  } catch (error) {
    console.error('Error fetching log:', error)
    return to(error)
  }
}

export async function updateLog(id: string, data: any): Promise<ActionResult<any>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Check if log exists
    const existingLog = await prisma.log.findUnique({
      where: { id },
      select: { userId: true, archivedAt: true },
    })

    if (!existingLog) {
      return { ok: false, message: 'Log not found' }
    }

    if (existingLog.archivedAt) {
      return { ok: false, message: 'Cannot update archived log' }
    }

    // Check permissions
    if (!canManageResource(user.role, user.id, existingLog.userId)) {
      return { ok: false, message: 'You do not have permission to update this log' }
    }

    const validation = updateLogSchema.safeParse(data)

    if (!validation.success) {
      return {
        ok: false,
        message: 'Invalid data',
        meta: { errors: validation.error.flatten() }
      }
    }

    const log = await prisma.log.update({
      where: { id },
      data: {
        ...validation.data,
        status: 'UPDATED',
      },
      include: {
        location: true,
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    })

    revalidatePath('/admin/logs')
    return { ok: true, data: log, message: 'Log updated successfully' }
  } catch (error) {
    console.error('Error updating log:', error)
    return to(error)
  }
}

export async function createLog(data: any): Promise<ActionResult<any>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Validate input
    const validation = createLogSchema.safeParse(data)
    if (!validation.success) {
      return {
        ok: false,
        message: 'Invalid data',
        meta: { errors: validation.error.flatten() }
      }
    }

    // For guards, verify they're on duty at the specified location
    if (user.role === 'GUARD') {
      const activeDutySession = await prisma.dutySession.findFirst({
        where: {
          userId: user.id,
          clockOutTime: null,
        },
      })

      if (!activeDutySession) {
        return {
          ok: false,
          message: 'You must be on duty to create a log'
        }
      }

      // Verify the location matches their duty location
      if (activeDutySession.locationId !== validation.data.locationId) {
        return {
          ok: false,
          message: 'You can only create logs for your current duty location'
        }
      }
    }

    // Create the log
    const log = await prisma.log.create({
      data: {
        ...validation.data,
        userId: user.id,
      },
      include: {
        location: true,
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    })

    revalidatePath('/admin/logs')
    return { ok: true, data: log, message: 'Log created successfully' }
  } catch (error) {
    console.error('Error creating log:', error)
    return to(error)
  }
}

export async function deleteLog(id: string): Promise<ActionResult<null>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Check if log exists
    const existingLog = await prisma.log.findUnique({
      where: { id },
      select: { userId: true, archivedAt: true },
    })

    if (!existingLog) {
      return { ok: false, message: 'Log not found' }
    }

    // Check permissions
    if (!canManageResource(user.role, user.id, existingLog.userId)) {
      return { ok: false, message: 'You do not have permission to delete this log' }
    }

    // Soft delete (archive)
    await prisma.log.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        status: 'ARCHIVED',
      },
    })

    revalidatePath('/admin/logs')
    return { ok: true, data: null, message: 'Log archived successfully' }
  } catch (error) {
    console.error('Error deleting log:', error)
    return to(error)
  }
}
