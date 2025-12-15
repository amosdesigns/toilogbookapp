'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/sync-user'
import { hasRole } from '@/lib/utils/auth'
import { to, type ActionResult } from '@/lib/utils/RenderError'

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

// Convert Decimal fields to numbers for client serialization
function serializeTimesheet(timesheet: unknown): unknown {
  const t = timesheet as Record<string, unknown>
  return {
    ...t,
    totalHours: t.totalHours ? Number(t.totalHours) : 0,
    entries: Array.isArray(t.entries) ? t.entries.map((entry: unknown) => {
      const e = entry as Record<string, unknown>
      return {
        ...e,
        hoursWorked: e.hoursWorked ? Number(e.hoursWorked) : 0,
        originalHours: e.originalHours ? Number(e.originalHours) : null,
      }
    }) : [],
  }
}

/**
 * Get all timesheets with optional filtering
 */
export async function getTimesheets(params: {
  userId?: string
  status?: string
  weekStartDate?: string
}): Promise<ActionResult<unknown[]>> {
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
      status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
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

    // Serialize Decimal fields to numbers
    const serialized = timesheets.map(serializeTimesheet)

    return { ok: true, data: serialized }
  } catch (error) {
    console.error('Error fetching timesheets:', error)
    return to(error)
  }
}

/**
 * Get a single timesheet by ID
 */
export async function getTimesheetById(id: string): Promise<ActionResult<unknown>> {
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
            adjuster: {
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

    // Serialize Decimal fields to numbers
    const serialized = serializeTimesheet(timesheet)

    return { ok: true, data: serialized }
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
}): Promise<ActionResult<unknown>> {
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
    const serialized = serializeTimesheet(timesheet)
    return {
      ok: true,
      data: serialized,
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
export async function submitTimesheet(id: string): Promise<ActionResult<unknown>> {
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
    const serialized = serializeTimesheet(updated)
    return { ok: true, data: serialized, message: 'Timesheet submitted for approval' }
  } catch (error) {
    console.error('Error submitting timesheet:', error)
    return to(error)
  }
}

/**
 * Approve a timesheet
 */
export async function approveTimesheet(id: string): Promise<ActionResult<unknown>> {
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
    const serialized = serializeTimesheet(updated)
    return { ok: true, data: serialized, message: 'Timesheet approved' }
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
): Promise<ActionResult<unknown>> {
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
    const serialized = serializeTimesheet(updated)
    return { ok: true, data: serialized, message: 'Timesheet rejected' }
  } catch (error) {
    console.error('Error rejecting timesheet:', error)
    return to(error)
  }
}

/**
 * Delete a timesheet (only if DRAFT status)
 */
export async function deleteTimesheet(id: string): Promise<ActionResult<null>> {
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
}): Promise<ActionResult<unknown[]>> {
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

/**
 * Adjust a timesheet entry (edit hours/times)
 */
export async function adjustTimesheetEntry(params: {
  entryId: string
  clockInTime: string
  clockOutTime: string
  reason: string
}): Promise<ActionResult<unknown>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!hasRole(user.role, 'SUPERVISOR')) {
      return { ok: false, message: 'Only supervisors can adjust entries' }
    }

    if (!params.reason || params.reason.trim().length === 0) {
      return { ok: false, message: 'Adjustment reason is required' }
    }

    const entry = await prisma.timesheetEntry.findUnique({
      where: { id: params.entryId },
      include: {
        timesheet: {
          select: {
            status: true,
          },
        },
      },
    })

    if (!entry) {
      return { ok: false, message: 'Entry not found' }
    }

    if (entry.timesheet.status !== 'DRAFT') {
      return {
        ok: false,
        message: 'Can only adjust entries in draft timesheets',
      }
    }

    const newClockIn = new Date(params.clockInTime)
    const newClockOut = new Date(params.clockOutTime)

    if (newClockOut <= newClockIn) {
      return { ok: false, message: 'Clock out must be after clock in' }
    }

    const newHours = calculateHours(newClockIn, newClockOut)

    // Update entry
    await prisma.timesheetEntry.update({
      where: { id: params.entryId },
      data: {
        clockInTime: newClockIn,
        clockOutTime: newClockOut,
        hoursWorked: newHours,
        wasAdjusted: true,
      },
    })

    // Create adjustment record
    await prisma.timesheetAdjustment.create({
      data: {
        timesheetId: entry.timesheetId,
        entryId: params.entryId,
        type: 'TIME_EDITED',
        fieldChanged: 'clockTimes',
        oldValue: JSON.stringify({
          clockInTime: entry.clockInTime,
          clockOutTime: entry.clockOutTime,
          hoursWorked: Number(entry.hoursWorked),
        }),
        newValue: JSON.stringify({
          clockInTime: newClockIn,
          clockOutTime: newClockOut,
          hoursWorked: newHours,
        }),
        adjustedBy: user.id,
        reason: params.reason,
      },
    })

    // Recalculate timesheet totals
    const allEntries = await prisma.timesheetEntry.findMany({
      where: { timesheetId: entry.timesheetId },
    })

    const totalHours = allEntries.reduce(
      (sum, e) => sum + Number(e.hoursWorked),
      0
    )

    await prisma.timesheet.update({
      where: { id: entry.timesheetId },
      data: { totalHours },
    })

    revalidatePath('/admin/dashboard/timesheets')
    return { ok: true, data: null, message: 'Entry adjusted successfully' }
  } catch (error) {
    console.error('Error adjusting entry:', error)
    return to(error)
  }
}

/**
 * Bulk approve multiple timesheets
 */
export async function bulkApproveTimesheets(
  timesheetIds: string[]
): Promise<ActionResult<{ approved: number; failed: number; errors: string[] }>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!hasRole(user.role, 'SUPERVISOR')) {
      return { ok: false, message: 'Only supervisors can approve timesheets' }
    }

    if (!timesheetIds || timesheetIds.length === 0) {
      return { ok: false, message: 'No timesheets selected' }
    }

    let approved = 0
    let failed = 0
    const errors: string[] = []

    // Process each timesheet
    for (const id of timesheetIds) {
      try {
        const timesheet = await prisma.timesheet.findUnique({
          where: { id },
          select: {
            status: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        })

        if (!timesheet) {
          errors.push(`Timesheet ${id} not found`)
          failed++
          continue
        }

        if (timesheet.status !== 'PENDING') {
          errors.push(
            `${timesheet.user.firstName} ${timesheet.user.lastName}: Not in pending status`
          )
          failed++
          continue
        }

        await prisma.timesheet.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvedBy: user.id,
            approvedAt: new Date(),
          },
        })

        approved++
      } catch (error) {
        console.error('Error approving timesheet %s:', id, error)
        errors.push(`Timesheet ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        failed++
      }
    }

    revalidatePath('/admin/dashboard/timesheets')

    return {
      ok: true,
      data: { approved, failed, errors },
      message: `Approved ${approved} timesheet(s)${failed > 0 ? `, ${failed} failed` : ''}`,
    }
  } catch (error) {
    console.error('Error in bulk approve:', error)
    return to(error)
  }
}
