import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

// PATCH /api/shifts/recurring/[id] - Update recurring pattern
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { name, startTime, endTime, daysOfWeek, isActive, endDate } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (daysOfWeek !== undefined) updateData.daysOfWeek = JSON.stringify(daysOfWeek)
    if (isActive !== undefined) updateData.isActive = isActive
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null

    const pattern = await prisma.recurringShiftPattern.update({
      where: { id },
      data: updateData,
      include: {
        location: true,
        userAssignments: {
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
        },
      },
    })

    return Response.json({ data: pattern }, { status: 200 })
  } catch (error) {
    console.error('Error updating recurring pattern:', error)
    return Response.json({ error: 'Failed to update recurring pattern' }, { status: 500 })
  }
}

// DELETE /api/shifts/recurring/[id] - Delete recurring pattern
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or higher
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return Response.json(
        { error: 'Insufficient permissions. Admin role or higher required.' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Note: This will also delete associated shifts if cascade is set
    await prisma.recurringShiftPattern.delete({
      where: { id },
    })

    return Response.json(
      { message: 'Recurring pattern deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting recurring pattern:', error)
    return Response.json({ error: 'Failed to delete recurring pattern' }, { status: 500 })
  }
}
