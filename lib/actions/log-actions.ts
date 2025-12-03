"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { to, type ActionResult } from "@/lib/utils/RenderError"
import type { LogWithRelations, IncidentWithDetails } from "@/lib/types/prisma-types"

export async function getLogsByLocation(
  locationId: string,
  limit: number = 20
): Promise<ActionResult<LogWithRelations[]>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
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

    return { ok: true, data: logs }
  } catch (error) {
    console.error("[GET_LOGS_BY_LOCATION]", error)
    return to(error)
  }
}

export async function getIncidents(): Promise<ActionResult<IncidentWithDetails[]>> {
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
