import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Only supervisors and above can view guards on duty
    if (!['SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Find all active duty sessions (clockOutTime is null)
    const activeDutySessions = await prisma.dutySession.findMany({
      where: {
        clockOutTime: null,
      },
      include: {
        user: true,
        location: true,
      },
      orderBy: {
        clockInTime: 'asc',
      },
    })

    // Calculate hours on duty and format data
    const guards = activeDutySessions.map((session) => {
      const now = new Date()
      const start = new Date(session.clockInTime)
      const diff = now.getTime() - start.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      return {
        id: session.id,
        userId: session.user.id,
        name: `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim(),
        email: session.user.email,
        role: session.user.role,
        locationId: session.locationId,
        locationName: session.location?.name || 'Roaming', // Handle null location
        clockInTime: session.clockInTime,
        hoursOnDuty: `${hours}h ${minutes}m`,
      }
    })

    return NextResponse.json(guards)
  } catch (error) {
    console.error("[GUARDS_ON_DUTY_GET]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
