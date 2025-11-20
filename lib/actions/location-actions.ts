"use server"

import { prisma } from "@/lib/prisma"

export async function getActiveLocations() {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    })

    return { success: true, locations }
  } catch (error) {
    console.error("[GET_ACTIVE_LOCATIONS]", error)
    return { success: false, error: "Failed to fetch locations", locations: [] }
  }
}

export async function getAllLocations() {
  try {
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    })

    return { success: true, locations }
  } catch (error) {
    console.error("[GET_ALL_LOCATIONS]", error)
    return { success: false, error: "Failed to fetch locations", locations: [] }
  }
}
