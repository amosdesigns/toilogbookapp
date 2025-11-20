"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function getGuardsOnDuty() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Unauthorized", guards: [] }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: "User not found", guards: [] }
    }

    // Verify supervisor role
    if (
      user.role !== "SUPERVISOR" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { success: false, error: "Unauthorized", guards: [] }
    }

    // Get all active duty sessions
    const activeSessions = await prisma.dutySession.findMany({
      where: {
        clockOutTime: null,
      },
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
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        clockInTime: "desc",
      },
    })

    // Transform data for the table
    const guards = activeSessions.map((session) => {
      const hoursOnDuty = (
        (new Date().getTime() - new Date(session.clockInTime).getTime()) /
        (1000 * 60 * 60)
      ).toFixed(1)

      return {
        userId: session.user.id,
        userName: `${session.user.firstName} ${session.user.lastName}`,
        userEmail: session.user.email,
        role: session.user.role,
        dutySessionId: session.id,
        locationId: session.locationId,
        locationName: session.location?.name || null,
        clockInTime: session.clockInTime,
        hoursOnDuty,
      }
    })

    return { success: true, guards }
  } catch (error) {
    console.error("[GET_GUARDS_ON_DUTY]", error)
    return { success: false, error: "Failed to fetch guards on duty", guards: [] }
  }
}
