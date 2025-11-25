"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { to, type Result } from "@/lib/utils/RenderError"

export async function getGuardsOnDuty(): Promise<Result<any>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { ok: false, message: "User not found" }
    }

    // Verify supervisor role
    if (
      user.role !== "SUPERVISOR" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { ok: false, message: "Unauthorized" }
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

    return { ok: true, data: guards }
  } catch (error) {
    console.error("[GET_GUARDS_ON_DUTY]", error)
    return to(error)
  }
}
