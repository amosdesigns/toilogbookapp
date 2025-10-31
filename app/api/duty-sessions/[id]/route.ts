import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateDutySessionSchema = z.object({
  notes: z.string().optional(),
})

// PATCH - Sign off duty (update clockOutTime)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await request.json()
    const body = updateDutySessionSchema.parse(json)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the duty session
    const dutySession = await prisma.dutySession.findUnique({
      where: { id: params.id },
    })

    if (!dutySession) {
      return NextResponse.json(
        { error: "Duty session not found" },
        { status: 404 }
      )
    }

    // Verify ownership
    if (dutySession.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only sign off your own duty session" },
        { status: 403 }
      )
    }

    // Check if already signed off
    if (dutySession.clockOutTime) {
      return NextResponse.json(
        { error: "Already signed off" },
        { status: 400 }
      )
    }

    // Update duty session
    const updatedSession = await prisma.dutySession.update({
      where: { id: params.id },
      data: {
        clockOutTime: new Date(),
        notes: body.notes,
      },
      include: {
        location: true,
        shift: true,
        locationCheckIns: {
          include: {
            location: true,
          },
        },
      },
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error("[DUTY_SESSION_PATCH]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
