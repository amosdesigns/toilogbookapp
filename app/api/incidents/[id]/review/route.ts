import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await the params
    const { id } = await params

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Only supervisors and above can review incidents
    if (!["SUPERVISOR", "ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { reviewNotes } = body

    // Update incident with review
    const incident = await prisma.log.update({
      where: { id },
      data: {
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
        followUpNotes: reviewNotes,
      },
      include: {
        user: true,
        shift: true,
        location: true,
        reviewer: true,
      },
    })

    return NextResponse.json(incident)
  } catch (error) {
    console.error("Error reviewing incident:", error)
    return NextResponse.json(
      { error: "Failed to review incident" },
      { status: 500 }
    )
  }
}
