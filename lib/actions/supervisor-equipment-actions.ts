"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { to, type ActionResult } from "@/lib/utils/RenderError"
import type { SupervisorEquipmentCheckout, Vehicle, Radio } from "@prisma/client"

export type EquipmentCheckoutWithEquipment = SupervisorEquipmentCheckout & {
  vehicle: Vehicle | null
  radio: Radio | null
}

export interface AvailableEquipmentItem {
  id: string
  identifier: string
}

// Get available fleet vehicles/radios for supervisor checkout
export async function getAvailableEquipment(
  type: "CAR" | "RADIO"
): Promise<ActionResult<AvailableEquipmentItem[]>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    if (type === "CAR") {
      const vehicles = await prisma.vehicle.findMany({
        where: {
          status: "WORKING",
          archivedAt: null,
          equipmentCheckouts: { none: { checkinTime: null } },
        },
        orderBy: { name: "asc" },
      })

      return {
        ok: true,
        data: vehicles.map((vehicle) => ({ id: vehicle.id, identifier: vehicle.name })),
      }
    }

    const radios = await prisma.radio.findMany({
      where: {
        status: "WORKING",
        archivedAt: null,
        equipmentCheckouts: { none: { checkinTime: null } },
      },
      orderBy: { name: "asc" },
    })

    return {
      ok: true,
      data: radios.map((radio) => ({ id: radio.id, identifier: radio.name })),
    }
  } catch (error) {
    console.error("[GET_AVAILABLE_EQUIPMENT]", error)
    return to(error)
  }
}

// Checkout equipment (car + radio together)
export async function checkoutEquipment(data: {
  dutySessionId: string
  carId: string
  radioId: string
  checkoutMileage: number
}): Promise<ActionResult<SupervisorEquipmentCheckout>> {
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

    // Use transaction to ensure both vehicle and radio are available and checked out atomically
    const checkout = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({ where: { id: data.carId } })

      if (!vehicle || vehicle.archivedAt || vehicle.status !== "WORKING") {
        throw new Error("Selected car is not available")
      }

      const radio = await tx.radio.findUnique({ where: { id: data.radioId } })

      if (!radio || radio.archivedAt || radio.status !== "WORKING") {
        throw new Error("Selected radio is not available")
      }

      const activeVehicleCheckout = await tx.supervisorEquipmentCheckout.findFirst({
        where: { vehicleId: data.carId, checkinTime: null },
      })

      if (activeVehicleCheckout) {
        throw new Error(`${vehicle.name} is already checked out`)
      }

      const activeRadioCheckout = await tx.supervisorEquipmentCheckout.findFirst({
        where: { radioId: data.radioId, checkinTime: null },
      })

      if (activeRadioCheckout) {
        throw new Error(`${radio.name} is already checked out`)
      }

      return tx.supervisorEquipmentCheckout.create({
        data: {
          dutySessionId: data.dutySessionId,
          vehicleId: data.carId,
          radioId: data.radioId,
          checkoutMileage: data.checkoutMileage,
        },
      })
    })

    revalidatePath("/admin/dashboard")

    return { ok: true, data: checkout }
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
}): Promise<ActionResult<SupervisorEquipmentCheckout>> {
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

    // Verify duty session belongs to user
    const dutySession = await prisma.dutySession.findUnique({
      where: { id: data.dutySessionId },
    })

    if (!dutySession || dutySession.userId !== user.id) {
      return { ok: false, message: "Unauthorized" }
    }

    // Get the active equipment checkout for this duty session
    const checkout = await prisma.supervisorEquipmentCheckout.findFirst({
      where: {
        dutySessionId: data.dutySessionId,
        checkinTime: null,
      },
    })

    if (!checkout) {
      return { ok: false, message: "No equipment checked out for this duty session" }
    }

    // Validate mileage for car
    if (checkout.checkoutMileage && data.checkinMileage < checkout.checkoutMileage) {
      return {
        ok: false,
        message: "Check-in mileage cannot be less than checkout mileage",
      }
    }

    const updated = await prisma.supervisorEquipmentCheckout.update({
      where: { id: checkout.id },
      data: {
        checkinTime: new Date(),
        checkinMileage: data.checkinMileage,
        notes: data.notes || null,
      },
    })

    revalidatePath("/admin/dashboard")

    return { ok: true, data: updated }
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
        vehicle: true,
        radio: true,
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
        name: "HQ401",
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
