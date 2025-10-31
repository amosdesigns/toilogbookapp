import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createDutySessionSchema = z.object({
  locationId: z.string().cuid().optional().nullable(), // null for supervisors (roaming)
  shiftId: z.string().cuid().optional(),
})

// GET - Get current active duty session for user
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get active duty session (clockOutTime is null)
    const activeDutySession = await prisma.dutySession.findFirst({
      where: {
        userId: user.id,
        clockOutTime: null,
      },
      include: {
        location: true,
        shift: true,
        locationCheckIns: {
          include: {
            location: true,
          },
          orderBy: {
            checkInTime: 'desc',
          },
        },
      },
    })

    return NextResponse.json(activeDutySession)
  } catch (error) {
    console.error("[DUTY_SESSIONS_GET]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Clock in (create duty session)
export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await request.json()
    const body = createDutySessionSchema.parse(json)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user already has an active duty session
    const existingSession = await prisma.dutySession.findFirst({
      where: {
        userId: user.id,
        clockOutTime: null,
      },
    })

    if (existingSession) {
      return NextResponse.json(
        { error: "Already on duty. Please sign off first." },
        { status: 400 }
      )
    }

    // Validate locationId for guards
    if (user.role === "GUARD" && !body.locationId) {
      return NextResponse.json(
        { error: "Guards must select a location" },
        { status: 400 }
      )
    }

    // Supervisors should have null locationId (roaming)
    if (
      (user.role === "SUPERVISOR" ||
       user.role === "ADMIN" ||
       user.role === "SUPER_ADMIN") &&
      body.locationId
    ) {
      body.locationId = null // Force null for roaming duty
    }

    // Create duty session
    const dutySession = await prisma.dutySession.create({
      data: {
        userId: user.id,
        locationId: body.locationId,
        shiftId: body.shiftId,
      },
      include: {
        location: true,
        shift: true,
      },
    })

    return NextResponse.json(dutySession)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error("[DUTY_SESSIONS_POST]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
