import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

// GET /api/shifts/[id] - Get single shift
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        location: true,
        assignments: {
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
        recurringPattern: true,
      },
    })

    if (!shift) {
      return Response.json({ error: 'Shift not found' }, { status: 404 })
    }

    return Response.json({ data: shift }, { status: 200 })
  } catch (error) {
    console.error('Error fetching shift:', error)
    return Response.json({ error: 'Failed to fetch shift' }, { status: 500 })
  }
}

// PATCH /api/shifts/[id] - Update shift
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
    const { name, startTime, endTime, locationId } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (startTime !== undefined) updateData.startTime = new Date(startTime)
    if (endTime !== undefined) updateData.endTime = new Date(endTime)
    if (locationId !== undefined) updateData.locationId = locationId

    const shift = await prisma.shift.update({
      where: { id },
      data: updateData,
      include: {
        location: true,
        assignments: {
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

    return Response.json({ data: shift }, { status: 200 })
  } catch (error) {
    console.error('Error updating shift:', error)
    return Response.json({ error: 'Failed to update shift' }, { status: 500 })
  }
}

// DELETE /api/shifts/[id] - Delete shift
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

    // Delete shift (cascade will handle assignments)
    await prisma.shift.delete({
      where: { id },
    })

    return Response.json({ message: 'Shift deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting shift:', error)
    return Response.json({ error: 'Failed to delete shift' }, { status: 500 })
  }
}
