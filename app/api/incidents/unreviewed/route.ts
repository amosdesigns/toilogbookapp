import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canManageShifts } from "@/lib/utils/auth"

// GET - Get unreviewed incidents (supervisors and above only)
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

    // Check if user is supervisor or above
    if (!canManageShifts(user.role)) {
      return NextResponse.json(
        { error: "Only supervisors can view unreviewed incidents" },
        { status: 403 }
      )
    }

    // Get unreviewed incidents, sorted by severity
    const incidents = await prisma.log.findMany({
      where: {
        type: "INCIDENT",
        reviewedBy: null,
        severity: {
          in: ["CRITICAL", "HIGH", "MEDIUM"],
        },
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
        shift: true,
      },
      orderBy: [
        {
          severity: "desc", // CRITICAL first
        },
        {
          createdAt: "desc",
        },
      ],
    })

    return NextResponse.json(incidents)
  } catch (error) {
    console.error("[INCIDENTS_UNREVIEWED_GET]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
