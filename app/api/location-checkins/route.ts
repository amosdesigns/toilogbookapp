import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { canManageShifts } from "@/lib/utils/auth"

const createLocationCheckInSchema = z.object({
  locationId: z.string().cuid(),
  notes: z.string().optional(),
})

// POST - Check in to a location (supervisors only)
export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await request.json()
    const body = createLocationCheckInSchema.parse(json)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is supervisor or above
    if (!canManageShifts(user.role)) {
      return NextResponse.json(
        { error: "Only supervisors can check in to locations" },
        { status: 403 }
      )
    }

    // Get active duty session
    const activeDutySession = await prisma.dutySession.findFirst({
      where: {
        userId: user.id,
        clockOutTime: null,
      },
    })

    if (!activeDutySession) {
      return NextResponse.json(
        { error: "You must be on duty to check in to a location" },
        { status: 400 }
      )
    }

    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: body.locationId },
    })

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      )
    }

    // Create location check-in
    const checkIn = await prisma.locationCheckIn.create({
      data: {
        dutySessionId: activeDutySession.id,
        locationId: body.locationId,
        userId: user.id,
        notes: body.notes,
      },
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
      },
    })

    return NextResponse.json(checkIn)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      )
    }

    console.error("[LOCATION_CHECKINS_POST]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Get location check-ins (optional filters)
export async function GET(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dutySessionId = searchParams.get("dutySessionId")
    const locationId = searchParams.get("locationId")

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Build where clause
    const where: any = {}

    if (dutySessionId) {
      where.dutySessionId = dutySessionId
    }

    if (locationId) {
      where.locationId = locationId
    }

    // Guards can only see their own check-ins
    // Supervisors and above can see all
    if (user.role === "GUARD") {
      where.userId = user.id
    }

    const checkIns = await prisma.locationCheckIn.findMany({
      where,
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
      },
      orderBy: {
        checkInTime: 'desc',
      },
    })

    return NextResponse.json(checkIns)
  } catch (error) {
    console.error("[LOCATION_CHECKINS_GET]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
