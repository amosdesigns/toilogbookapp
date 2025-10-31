import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { canManageShifts } from "@/lib/utils/auth"

const reviewIncidentSchema = z.object({
  reviewNotes: z.string().min(1, "Review notes are required"),
  status: z.enum(["LIVE", "UPDATED", "ARCHIVED"]).optional(),
})

// POST - Review an incident (supervisors and above only)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await request.json()
    const body = reviewIncidentSchema.parse(json)

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
        { error: "Only supervisors can review incidents" },
        { status: 403 }
      )
    }

    // Get the incident log
    const incident = await prisma.log.findUnique({
      where: { id: params.id },
    })

    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      )
    }

    // Verify it's an incident
    if (incident.type !== "INCIDENT") {
      return NextResponse.json(
        { error: "This log is not an incident report" },
        { status: 400 }
      )
    }

    // Check if already reviewed
    if (incident.reviewedBy) {
      return NextResponse.json(
        { error: "Incident already reviewed" },
        { status: 400 }
      )
    }

    // Update incident with review
    const reviewedIncident = await prisma.log.update({
      where: { id: params.id },
      data: {
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewNotes: body.reviewNotes,
        status: body.status || "UPDATED",
      },
      include: {
        location: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        shift: true,
      },
    })

    return NextResponse.json(reviewedIncident)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error("[INCIDENT_REVIEW_POST]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
