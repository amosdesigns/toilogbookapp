import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

// POST /api/shifts/assignments - Assign user to shift
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is supervisor or higher
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || !['SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return Response.json(
        { error: 'Insufficient permissions. Supervisor role or higher required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { shiftId, assignedUserId, role } = body

    if (!shiftId || !assignedUserId) {
      return Response.json(
        { error: 'Missing required fields: shiftId, assignedUserId' },
        { status: 400 }
      )
    }

    // Check if shift exists
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: { location: true },
    })

    if (!shift) {
      return Response.json({ error: 'Shift not found' }, { status: 404 })
    }

    // Check location capacity if set
    if (shift.location.maxCapacity) {
      const currentAssignments = await prisma.shiftAssignment.count({
        where: { shiftId },
      })

      if (currentAssignments >= shift.location.maxCapacity) {
        return Response.json(
          {
            error: `Location capacity exceeded. Maximum ${shift.location.maxCapacity} guards allowed per shift.`,
          },
          { status: 400 }
        )
      }
    }

    // Create assignment (unique constraint will prevent duplicates)
    const assignment = await prisma.shiftAssignment.create({
      data: {
        shiftId,
        userId: assignedUserId,
        role: role || null,
      },
      include: {
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

    return Response.json({ data: assignment }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating shift assignment:', error)

    // Handle duplicate assignment error
    if (error.code === 'P2002') {
      return Response.json(
        { error: 'User is already assigned to this shift' },
        { status: 400 }
      )
    }

    return Response.json({ error: 'Failed to create shift assignment' }, { status: 500 })
  }
}

// DELETE /api/shifts/assignments - Remove user from shift
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is supervisor or higher
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || !['SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return Response.json(
        { error: 'Insufficient permissions. Supervisor role or higher required.' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const assignmentId = searchParams.get('assignmentId')
    const shiftId = searchParams.get('shiftId')
    const assignedUserId = searchParams.get('userId')

    // Can delete by assignmentId OR by combination of shiftId + userId
    if (assignmentId) {
      await prisma.shiftAssignment.delete({
        where: { id: assignmentId },
      })
    } else if (shiftId && assignedUserId) {
      await prisma.shiftAssignment.delete({
        where: {
          shiftId_userId: {
            shiftId,
            userId: assignedUserId,
          },
        },
      })
    } else {
      return Response.json(
        { error: 'Must provide either assignmentId or both shiftId and userId' },
        { status: 400 }
      )
    }

    return Response.json({ message: 'Assignment removed successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting shift assignment:', error)
    return Response.json({ error: 'Failed to delete shift assignment' }, { status: 500 })
  }
}
