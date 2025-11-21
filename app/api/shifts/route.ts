import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

// GET /api/shifts - Query shifts with filters
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const locationId = searchParams.get('locationId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const assignedUserId = searchParams.get('assignedUserId')

    const where: any = {}

    if (locationId) {
      where.locationId = locationId
    }

    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) {
        where.startTime.gte = new Date(startDate)
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate)
      }
    }

    if (assignedUserId) {
      where.assignments = {
        some: {
          userId: assignedUserId,
        },
      }
    }

    const shifts = await prisma.shift.findMany({
      where,
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
      orderBy: {
        startTime: 'asc',
      },
    })

    return Response.json({ data: shifts }, { status: 200 })
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return Response.json({ error: 'Failed to fetch shifts' }, { status: 500 })
  }
}

// POST /api/shifts - Create a new shift
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
    const { name, startTime, endTime, locationId, recurringPatternId, userAssignments } = body

    // Validate required fields
    if (!name || !startTime || !endTime || !locationId) {
      return Response.json(
        { error: 'Missing required fields: name, startTime, endTime, locationId' },
        { status: 400 }
      )
    }

    // Create shift
    const shift = await prisma.shift.create({
      data: {
        name,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        locationId,
        recurringPatternId: recurringPatternId || null,
      },
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

    // Assign users if provided
    if (userAssignments && Array.isArray(userAssignments)) {
      for (const assignment of userAssignments) {
        await prisma.shiftAssignment.create({
          data: {
            shiftId: shift.id,
            userId: assignment.userId,
            role: assignment.role || null,
          },
        })
      }

      // Fetch updated shift with assignments
      const updatedShift = await prisma.shift.findUnique({
        where: { id: shift.id },
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

      return Response.json({ data: updatedShift }, { status: 201 })
    }

    return Response.json({ data: shift }, { status: 201 })
  } catch (error) {
    console.error('Error creating shift:', error)
    return Response.json({ error: 'Failed to create shift' }, { status: 500 })
  }
}
