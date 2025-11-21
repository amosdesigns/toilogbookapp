import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

// GET /api/shifts/recurring - Get all recurring shift patterns
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const locationId = searchParams.get('locationId')
    const isActive = searchParams.get('isActive')

    const where: any = {}

    if (locationId) {
      where.locationId = locationId
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const patterns = await prisma.recurringShiftPattern.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return Response.json({ data: patterns }, { status: 200 })
  } catch (error) {
    console.error('Error fetching recurring patterns:', error)
    return Response.json({ error: 'Failed to fetch recurring patterns' }, { status: 500 })
  }
}

// POST /api/shifts/recurring - Create recurring shift pattern
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
    const {
      name,
      locationId,
      startTime,
      endTime,
      daysOfWeek,
      startDate,
      endDate,
      userAssignments,
      generateShifts,
    } = body

    // Validate required fields
    if (!name || !locationId || !startTime || !endTime || !daysOfWeek || !startDate) {
      return Response.json(
        {
          error:
            'Missing required fields: name, locationId, startTime, endTime, daysOfWeek, startDate',
        },
        { status: 400 }
      )
    }

    // Validate daysOfWeek is array
    if (!Array.isArray(daysOfWeek)) {
      return Response.json({ error: 'daysOfWeek must be an array' }, { status: 400 })
    }

    // Create recurring pattern
    const pattern = await prisma.recurringShiftPattern.create({
      data: {
        name,
        locationId,
        startTime,
        endTime,
        daysOfWeek: JSON.stringify(daysOfWeek),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
      },
      include: {
        location: true,
      },
    })

    // Assign users if provided
    if (userAssignments && Array.isArray(userAssignments)) {
      for (const assignment of userAssignments) {
        await prisma.recurringUserAssignment.create({
          data: {
            recurringPatternId: pattern.id,
            userId: assignment.userId,
            role: assignment.role || null,
          },
        })
      }
    }

    // Optionally generate shifts immediately
    if (generateShifts) {
      const { days = 30 } = generateShifts
      await generateShiftsFromPattern(pattern.id, days)
    }

    // Fetch updated pattern with assignments
    const updatedPattern = await prisma.recurringShiftPattern.findUnique({
      where: { id: pattern.id },
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

    return Response.json({ data: updatedPattern }, { status: 201 })
  } catch (error) {
    console.error('Error creating recurring pattern:', error)
    return Response.json({ error: 'Failed to create recurring pattern' }, { status: 500 })
  }
}

// Helper function to generate shifts from pattern
async function generateShiftsFromPattern(patternId: string, days: number) {
  const pattern = await prisma.recurringShiftPattern.findUnique({
    where: { id: patternId },
    include: {
      userAssignments: true,
    },
  })

  if (!pattern) return

  const daysOfWeek = JSON.parse(pattern.daysOfWeek)
  const today = new Date()
  const startDate = new Date(Math.max(today.getTime(), pattern.startDate.getTime()))

  for (let day = 0; day < days; day++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(currentDate.getDate() + day)
    const dayOfWeek = currentDate.getDay()

    // Check if pattern applies to this day
    if (daysOfWeek.includes(dayOfWeek)) {
      // Check if pattern has ended
      if (pattern.endDate && currentDate > pattern.endDate) {
        break
      }

      const [startHour, startMin] = pattern.startTime.split(':').map(Number)
      const [endHour, endMin] = pattern.endTime.split(':').map(Number)

      const shiftStart = new Date(currentDate)
      shiftStart.setHours(startHour, startMin, 0, 0)

      const shiftEnd = new Date(currentDate)
      shiftEnd.setHours(endHour, endMin, 0, 0)

      // Handle overnight shifts
      if (endHour < startHour) {
        shiftEnd.setDate(shiftEnd.getDate() + 1)
      }

      // Check if shift already exists
      const existingShift = await prisma.shift.findFirst({
        where: {
          recurringPatternId: pattern.id,
          startTime: shiftStart,
        },
      })

      if (!existingShift) {
        // Create shift
        const shift = await prisma.shift.create({
          data: {
            name: pattern.name,
            startTime: shiftStart,
            endTime: shiftEnd,
            locationId: pattern.locationId,
            recurringPatternId: pattern.id,
          },
        })

        // Assign users from pattern
        for (const assignment of pattern.userAssignments) {
          await prisma.shiftAssignment.create({
            data: {
              shiftId: shift.id,
              userId: assignment.userId,
              role: assignment.role,
            },
          })
        }
      }
    }
  }
}
