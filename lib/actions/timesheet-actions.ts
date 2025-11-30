'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/sync-user'
import { hasRole } from '@/lib/utils/auth'
import { to, type Result } from '@/lib/utils/RenderError'

// Helper function to get week boundaries (Sunday-Saturday)
function getWeekBoundaries(date: Date): { weekStart: Date; weekEnd: Date } {
  const d = new Date(date)
  const day = d.getDay()

  // Get Sunday of this week
  const weekStart = new Date(d)
  weekStart.setDate(d.getDate() - day)
  weekStart.setHours(0, 0, 0, 0)

  // Get Saturday of this week
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  return { weekStart, weekEnd }
}

// Calculate hours between two dates
function calculateHours(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime()
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100 // Round to 2 decimals
}

/**
 * Get all timesheets with optional filtering
 */
export async function getTimesheets(params: {
  userId?: string
  status?: string
  weekStartDate?: string
}): Promise<Result<unknown[]>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Only supervisors and above can view timesheets
    if (!hasRole(user.role, 'SUPERVISOR')) {
      return { ok: false, message: 'Insufficient permissions' }
    }

    const where: {
      userId?: string
      status?: string
      weekStartDate?: Date
    } = {}

    if (params.userId) {
      where.userId = params.userId
    }

    if (params.status) {
      where.status = params.status as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
    }

    if (params.weekStartDate) {
      where.weekStartDate = new Date(params.weekStartDate)
    }

    const timesheets = await prisma.timesheet.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        entries: {
          include: {
            location: {
              select: {
                name: true,
              },
            },
          },
        },
        approver: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { weekStartDate: 'desc' },
        { user: { lastName: 'asc' } },
      ],
    })

    return { ok: true, data: timesheets }
  } catch (error) {
    console.error('Error fetching timesheets:', error)
    return to(error)
  }
}

/**
 * Get a single timesheet by ID
 */
export async function getTimesheetById(id: string): Promise<Result<unknown>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!hasRole(user.role, 'SUPERVISOR')) {
      return { ok: false, message: 'Insufficient permissions' }
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        entries: {
          include: {
            location: {
              select: {
                name: true,
              },
            },
            shift: {
              select: {
                name: true,
              },
            },
            dutySession: true,
          },
          orderBy: {
            date: 'asc',
          },
        },
        adjustments: {
          include: {
            adjustedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        approver: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        rejector: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!timesheet) {
      return { ok: false, message: 'Timesheet not found' }
    }

    return { ok: true, data: timesheet }
  } catch (error) {
    console.error('Error fetching timesheet:', error)
    return to(error)
  }
}

/**
 * Generate a timesheet for a user for a specific week
 */
export async function generateTimesheet(params: {
  userId: string
  weekStartDate: string // ISO date string
}): Promise<Result<unknown>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!hasRole(user.role, 'SUPERVISOR')) {
      return { ok: false, message: 'Only supervisors can generate timesheets' }
    }

    const weekStart = new Date(params.weekStartDate)
    const { weekEnd } = getWeekBoundaries(weekStart)

    // Check if timesheet already exists
    const existing = await prisma.timesheet.findUnique({
      where: {
        userId_weekStartDate: {
          userId: params.userId,
          weekStartDate: weekStart,
        },
      },
    })

    if (existing) {
      return { ok: false, message: 'Timesheet already exists for this week' }
    }

    // Get all duty sessions for this user in this week
    const dutySessions = await prisma.dutySession.findMany({
      where: {
        userId: params.userId,
        clockInTime: {
          gte: weekStart,
          lte: weekEnd,
        },
        clockOutTime: {
          not: null, // Only completed sessions
        },
      },
      include: {
        location: true,
        shift: true,
      },
      orderBy: {
        clockInTime: 'asc',
      },
    })

    if (dutySessions.length === 0) {
      return { ok: false, message: 'No completed duty sessions found for this week' }
    }

    // Calculate total hours
    let totalHours = 0
    const entries = dutySessions.map((session) => {
      const hours = calculateHours(session.clockInTime, session.clockOutTime!)
      totalHours += hours

      return {
        dutySessionId: session.id,
        date: session.clockInTime,
        clockInTime: session.clockInTime,
        clockOutTime: session.clockOutTime!,
        hoursWorked: hours,
        locationId: session.locationId,
        shiftId: session.shiftId,
        originalClockIn: session.clockInTime,
        originalClockOut: session.clockOutTime!,
        originalHours: hours,
        wasAdjusted: false,
        wasManuallyAdded: false,
      }
    })

    // Create timesheet with entries
    const timesheet = await prisma.timesheet.create({
      data: {
        userId: params.userId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        totalHours,
        totalEntries: entries.length,
        status: 'DRAFT',
        createdBy: user.id,
        entries: {
          create: entries,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        entries: {
          include: {
            location: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    revalidatePath('/admin/dashboard/timesheets')
    return {
      ok: true,
      data: timesheet,
      message: `Timesheet generated with ${entries.length} entries (${totalHours} hours)`,
    }
  } catch (error) {
    console.error('Error generating timesheet:', error)
    return to(error)
  }
}

/**
 * Submit timesheet for approval (changes status from DRAFT to PENDING)
 */
export async function submitTimesheet(id: string): Promise<Result<unknown>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!hasRole(user.role, 'SUPERVISOR')) {
      return { ok: false, message: 'Insufficient permissions' }
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
    })

    if (!timesheet) {
      return { ok: false, message: 'Timesheet not found' }
    }

    if (timesheet.status !== 'DRAFT') {
      return { ok: false, message: 'Only draft timesheets can be submitted' }
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        status: 'PENDING',
        submittedAt: new Date(),
        submittedBy: user.id,
      },
    })

    revalidatePath('/admin/dashboard/timesheets')
    return { ok: true, data: updated, message: 'Timesheet submitted for approval' }
  } catch (error) {
    console.error('Error submitting timesheet:', error)
    return to(error)
  }
}

/**
 * Approve a timesheet
 */
export async function approveTimesheet(id: string): Promise<Result<unknown>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!hasRole(user.role, 'SUPERVISOR')) {
      return { ok: false, message: 'Only supervisors can approve timesheets' }
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
    })

    if (!timesheet) {
      return { ok: false, message: 'Timesheet not found' }
    }

    if (timesheet.status !== 'PENDING') {
      return { ok: false, message: 'Only pending timesheets can be approved' }
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: user.id,
        approvedAt: new Date(),
      },
    })

    revalidatePath('/admin/dashboard/timesheets')
    return { ok: true, data: updated, message: 'Timesheet approved' }
  } catch (error) {
    console.error('Error approving timesheet:', error)
    return to(error)
  }
}

/**
 * Reject a timesheet
 */
export async function rejectTimesheet(
  id: string,
  reason: string
): Promise<Result<unknown>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!hasRole(user.role, 'SUPERVISOR')) {
      return { ok: false, message: 'Only supervisors can reject timesheets' }
    }

    if (!reason || reason.trim().length === 0) {
      return { ok: false, message: 'Rejection reason is required' }
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
    })

    if (!timesheet) {
      return { ok: false, message: 'Timesheet not found' }
    }

    if (timesheet.status !== 'PENDING') {
      return { ok: false, message: 'Only pending timesheets can be rejected' }
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedBy: user.id,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    })

    revalidatePath('/admin/dashboard/timesheets')
    return { ok: true, data: updated, message: 'Timesheet rejected' }
  } catch (error) {
    console.error('Error rejecting timesheet:', error)
    return to(error)
  }
}

/**
 * Delete a timesheet (only if DRAFT status)
 */
export async function deleteTimesheet(id: string): Promise<Result<null>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!hasRole(user.role, 'SUPERVISOR')) {
      return { ok: false, message: 'Insufficient permissions' }
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
    })

    if (!timesheet) {
      return { ok: false, message: 'Timesheet not found' }
    }

    if (timesheet.status !== 'DRAFT') {
      return {
        ok: false,
        message: 'Only draft timesheets can be deleted',
      }
    }

    await prisma.timesheet.delete({
      where: { id },
    })

    revalidatePath('/admin/dashboard/timesheets')
    return { ok: true, data: null, message: 'Timesheet deleted' }
  } catch (error) {
    console.error('Error deleting timesheet:', error)
    return to(error)
  }
}

/**
 * Get all users who have duty sessions (for timesheet generation)
 */
export async function getUsersWithDutySessions(params: {
  weekStartDate: string
}): Promise<Result<unknown[]>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!hasRole(user.role, 'SUPERVISOR')) {
      return { ok: false, message: 'Insufficient permissions' }
    }

    const weekStart = new Date(params.weekStartDate)
    const { weekEnd } = getWeekBoundaries(weekStart)

    // Get users who have completed duty sessions this week
    const users = await prisma.user.findMany({
      where: {
        dutySessions: {
          some: {
            clockInTime: {
              gte: weekStart,
              lte: weekEnd,
            },
            clockOutTime: {
              not: null,
            },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    return { ok: true, data: users }
  } catch (error) {
    console.error('Error fetching users with duty sessions:', error)
    return to(error)
  }
}
