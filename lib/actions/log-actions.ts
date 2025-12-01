"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { to, type ActionResult } from "@/lib/utils/RenderError"

export async function getLogsByLocation(locationId: string, limit: number = 20) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Unauthorized", logs: [] }
    }

    const logs = await prisma.log.findMany({
      where: {
        locationId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        location: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    return { success: true, logs }
  } catch (error) {
    console.error("[GET_LOGS_BY_LOCATION]", error)
    return { success: false, error: "Failed to fetch logs", logs: [] }
  }
}

export async function getIncidents(): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    const logs = await prisma.log.findMany({
      where: {
        type: "INCIDENT",
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        location: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { ok: true, data: logs }
  } catch (error) {
    console.error("[GET_INCIDENTS]", error)
    return to(error)
  }
}
