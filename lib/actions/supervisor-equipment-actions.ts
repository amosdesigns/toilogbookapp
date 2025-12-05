"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { to, type ActionResult } from "@/lib/utils/RenderError"
import type { SupervisorEquipment, SupervisorEquipmentCheckout } from "@prisma/client"

type EquipmentCheckoutWithEquipment = SupervisorEquipmentCheckout & {
  equipment: SupervisorEquipment
}

// Get available equipment by type
export async function getAvailableEquipment(
  type: "CAR" | "RADIO"
): Promise<ActionResult<SupervisorEquipment[]>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    const equipment = await prisma.supervisorEquipment.findMany({
      where: {
        type,
        isAvailable: true,
      },
      orderBy: {
        identifier: "asc",
      },
    })

    return { ok: true, data: equipment }
  } catch (error) {
    console.error("[GET_AVAILABLE_EQUIPMENT]", error)
    return to(error)
  }
}

// Get all equipment (for admin management)
export async function getAllEquipment(): Promise<ActionResult<SupervisorEquipment[]>> {
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

    // Check if user is admin or supervisor
    if (
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "SUPERVISOR"
    ) {
      return { ok: false, message: "Unauthorized" }
    }

    const equipment = await prisma.supervisorEquipment.findMany({
      orderBy: [{ type: "asc" }, { identifier: "asc" }],
    })

    return { ok: true, data: equipment }
  } catch (error) {
    console.error("[GET_ALL_EQUIPMENT]", error)
    return to(error)
  }
}

// Create new equipment
export async function createEquipment(
  type: "CAR" | "RADIO",
  identifier: string
): Promise<ActionResult<SupervisorEquipment>> {
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

    // Check if user is admin
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return { ok: false, message: "Only admins can create equipment" }
    }

    // Check if equipment already exists
    const existing = await prisma.supervisorEquipment.findUnique({
      where: {
        type_identifier: {
          type,
          identifier,
        },
      },
    })

    if (existing) {
      return { ok: false, message: "Equipment with this identifier already exists" }
    }

    const equipment = await prisma.supervisorEquipment.create({
      data: {
        type,
        identifier,
      },
    })

    revalidatePath("/admin/dashboard/equipment")

    return { ok: true, data: equipment }
  } catch (error) {
    console.error("[CREATE_EQUIPMENT]", error)
    return to(error)
  }
}

// Checkout equipment (car + radio together)
export async function checkoutEquipment(data: {
  dutySessionId: string
  carId: string
  radioId: string
  checkoutMileage: number
}): Promise<ActionResult<SupervisorEquipmentCheckout[]>> {
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

    // Verify duty session exists and belongs to user
    const dutySession = await prisma.dutySession.findUnique({
      where: { id: data.dutySessionId },
    })

    if (!dutySession) {
      return { ok: false, message: "Duty session not found" }
    }

    if (dutySession.userId !== user.id) {
      return { ok: false, message: "Unauthorized" }
    }

    // Use transaction to ensure both equipment are available and checked out atomically
    const checkouts = await prisma.$transaction(async (tx) => {
      // Check car availability
      const car = await tx.supervisorEquipment.findUnique({
        where: { id: data.carId },
      })

      if (!car) {
        throw new Error("Car not found")
      }

      if (!car.isAvailable) {
        throw new Error(`Car ${car.identifier} is not available`)
      }

      // Check radio availability
      const radio = await tx.supervisorEquipment.findUnique({
        where: { id: data.radioId },
      })

      if (!radio) {
        throw new Error("Radio not found")
      }

      if (!radio.isAvailable) {
        throw new Error(`Radio ${radio.identifier} is not available`)
      }

      // Create car checkout
      const carCheckout = await tx.supervisorEquipmentCheckout.create({
        data: {
          dutySessionId: data.dutySessionId,
          equipmentId: data.carId,
          checkoutMileage: data.checkoutMileage,
        },
      })

      // Create radio checkout
      const radioCheckout = await tx.supervisorEquipmentCheckout.create({
        data: {
          dutySessionId: data.dutySessionId,
          equipmentId: data.radioId,
        },
      })

      // Mark both equipment as unavailable
      await tx.supervisorEquipment.update({
        where: { id: data.carId },
        data: { isAvailable: false },
      })

      await tx.supervisorEquipment.update({
        where: { id: data.radioId },
        data: { isAvailable: false },
      })

      return [carCheckout, radioCheckout]
    })

    revalidatePath("/admin/dashboard")

    return { ok: true, data: checkouts }
  } catch (error) {
    console.error("[CHECKOUT_EQUIPMENT]", error)
    return to(error)
  }
}

// Check in equipment (return car + radio)
export async function checkinEquipment(data: {
  dutySessionId: string
  checkinMileage: number
  notes?: string
}): Promise<ActionResult<SupervisorEquipmentCheckout[]>> {
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

    // Get all equipment checkouts for this duty session
    const checkouts = await prisma.supervisorEquipmentCheckout.findMany({
      where: {
        dutySessionId: data.dutySessionId,
        checkinTime: null, // Only get unchecked-in equipment
      },
      include: {
        equipment: true,
      },
    })

    if (checkouts.length === 0) {
      return { ok: false, message: "No equipment checked out for this duty session" }
    }

    // Verify duty session belongs to user
    const dutySession = await prisma.dutySession.findUnique({
      where: { id: data.dutySessionId },
    })

    if (!dutySession || dutySession.userId !== user.id) {
      return { ok: false, message: "Unauthorized" }
    }

    // Validate mileage for car
    const carCheckout = checkouts.find((c) => c.equipment.type === "CAR")
    if (carCheckout && carCheckout.checkoutMileage) {
      if (data.checkinMileage < carCheckout.checkoutMileage) {
        return {
          ok: false,
          message: "Check-in mileage cannot be less than checkout mileage",
        }
      }
    }

    // Use transaction to check in all equipment
    const updatedCheckouts = await prisma.$transaction(async (tx) => {
      const updates = []

      for (const checkout of checkouts) {
        // Update checkout record
        const updated = await tx.supervisorEquipmentCheckout.update({
          where: { id: checkout.id },
          data: {
            checkinTime: new Date(),
            checkinMileage: checkout.equipment.type === "CAR" ? data.checkinMileage : null,
            notes: data.notes || null,
          },
          include: {
            equipment: true,
          },
        })

        // Mark equipment as available
        await tx.supervisorEquipment.update({
          where: { id: checkout.equipmentId },
          data: { isAvailable: true },
        })

        updates.push(updated)
      }

      return updates
    })

    revalidatePath("/admin/dashboard")

    return { ok: true, data: updatedCheckouts }
  } catch (error) {
    console.error("[CHECKIN_EQUIPMENT]", error)
    return to(error)
  }
}

// Get equipment checkouts for a duty session
export async function getEquipmentCheckouts(
  dutySessionId: string
): Promise<ActionResult<EquipmentCheckoutWithEquipment[]>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    const checkouts = await prisma.supervisorEquipmentCheckout.findMany({
      where: {
        dutySessionId,
      },
      include: {
        equipment: true,
      },
      orderBy: {
        checkoutTime: "desc",
      },
    })

    return { ok: true, data: checkouts }
  } catch (error) {
    console.error("[GET_EQUIPMENT_CHECKOUTS]", error)
    return to(error)
  }
}

// Get HQ location
export async function getHQLocation(): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const hqLocation = await prisma.location.findFirst({
      where: {
        name: "HQ - Headquarters",
      },
      select: {
        id: true,
        name: true,
      },
    })

    if (!hqLocation) {
      return { ok: false, message: "HQ location not found" }
    }

    return { ok: true, data: hqLocation }
  } catch (error) {
    console.error("[GET_HQ_LOCATION]", error)
    return to(error)
  }
}
