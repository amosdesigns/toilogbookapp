"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { to, type ActionResult } from "@/lib/utils/RenderError"
import type { DutySession } from "@prisma/client"
import type {
  DutySessionWithCheckIns,
  DutySessionWithRelations,
  LocationCheckInWithLocation,
} from "@/lib/types/prisma-types"

export async function getActiveDutySession(): Promise<ActionResult<DutySessionWithCheckIns | null>> {
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

    // Get active duty session (clockOutTime is null)
    const activeDutySession = await prisma.dutySession.findFirst({
      where: {
        userId: user.id,
        clockOutTime: null,
      },
      include: {
        location: true,
        shift: true,
        locationCheckIns: {
          include: {
            location: true,
          },
          orderBy: {
            checkInTime: "desc",
          },
        },
      },
    })

    return { ok: true, data: activeDutySession }
  } catch (error) {
    console.error("[GET_ACTIVE_DUTY_SESSION]", error)
    return to(error)
  }
}

export async function clockIn(data: { locationId?: string; shiftId?: string }): Promise<ActionResult<DutySessionWithRelations>> {
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

    // Check if user already has an active duty session
    const existingSession = await prisma.dutySession.findFirst({
      where: {
        userId: user.id,
        clockOutTime: null,
      },
    })

    if (existingSession) {
      return { ok: false, message: "Already on duty. Please sign off first." }
    }

    // Validate locationId for guards
    if (user.role === "GUARD" && !data.locationId) {
      return { ok: false, message: "Guards must select a location" }
    }

    // Supervisors/Admins should use HQ location (not roaming with null)
    let locationId: string | null | undefined = data.locationId
    if (
      user.role === "SUPERVISOR" ||
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN"
    ) {
      // Get HQ location
      const hqLocation = await prisma.location.findFirst({
        where: {
          name: "HQ - Headquarters",
        },
      })

      if (!hqLocation) {
        return { ok: false, message: "HQ location not found. Please contact administrator." }
      }

      locationId = hqLocation.id
    }

    // Create duty session
    const dutySession = await prisma.dutySession.create({
      data: {
        userId: user.id,
        locationId: locationId,
        shiftId: data.shiftId || null,
      },
      include: {
        location: true,
        shift: true,
      },
    })

    // If supervisor clocked in, notify all active guards
    if (
      user.role === "SUPERVISOR" ||
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN"
    ) {
      // Get all guards currently on duty
      const activeGuards = await prisma.dutySession.findMany({
        where: {
          clockOutTime: null,
          user: {
            role: "GUARD",
          },
        },
        include: {
          user: true,
        },
      })

      // Create notifications for each active guard
      if (activeGuards.length > 0) {
        await prisma.notification.createMany({
          data: activeGuards.map((guardSession) => ({
            userId: guardSession.userId,
            type: "INFO",
            priority: "MEDIUM",
            title: "Supervisor On Duty",
            message: `${user.firstName} ${user.lastName} has started their shift`,
            dismissible: true,
          })),
        })
      }
    }

    revalidatePath("/")
    revalidatePath("/admin/dashboard")

    return { ok: true, data: dutySession }
  } catch (error) {
    console.error("[CLOCK_IN]", error)
    return to(error)
  }
}

export async function clockOut(dutySessionId: string, notes?: string): Promise<ActionResult<DutySessionWithRelations>> {
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

    // Get duty session
    const dutySession = await prisma.dutySession.findUnique({
      where: { id: dutySessionId },
    })

    if (!dutySession) {
      return { ok: false, message: "Duty session not found" }
    }

    // Verify ownership
    if (dutySession.userId !== user.id) {
      return { ok: false, message: "Unauthorized" }
    }

    // Update duty session
    const updatedSession = await prisma.dutySession.update({
      where: { id: dutySessionId },
      data: {
        clockOutTime: new Date(),
        notes: notes || null,
      },
      include: {
        location: true,
        shift: true,
      },
    })

    revalidatePath("/")
    revalidatePath("/admin/dashboard")

    return { ok: true, data: updatedSession }
  } catch (error) {
    console.error("[CLOCK_OUT]", error)
    return to(error)
  }
}

export async function supervisorClockOut(dutySessionId: string): Promise<ActionResult<DutySession>> {
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
      return { ok: false, message: "Only supervisors can override clock out" }
    }

    // Get duty session
    const dutySession = await prisma.dutySession.findUnique({
      where: { id: dutySessionId },
    })

    if (!dutySession) {
      return { ok: false, message: "Duty session not found" }
    }

    // Update duty session
    const updatedSession = await prisma.dutySession.update({
      where: { id: dutySessionId },
      data: {
        clockOutTime: new Date(),
        notes: "Clocked out by supervisor override",
      },
    })

    revalidatePath("/admin/dashboard")

    return { ok: true, data: updatedSession }
  } catch (error) {
    console.error("[SUPERVISOR_CLOCK_OUT]", error)
    return to(error)
  }
}

export async function createLocationCheckIn(
  dutySessionId: string,
  locationId: string,
  notes?: string
): Promise<ActionResult<LocationCheckInWithLocation>> {
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

    // Check if there's an active location check-in (no checkOutTime)
    const activeCheckIn = await prisma.locationCheckIn.findFirst({
      where: {
        dutySessionId,
        checkOutTime: null,
      },
    })

    if (activeCheckIn) {
      return {
        ok: false,
        message: "You must check out from your current location before checking in to a new one",
      }
    }

    // Create location check-in
    const checkIn = await prisma.locationCheckIn.create({
      data: {
        dutySessionId,
        locationId,
        userId: user.id,
        notes: notes || null,
      },
      include: {
        location: true,
      },
    })

    revalidatePath("/admin/dashboard")

    return { ok: true, data: checkIn }
  } catch (error) {
    console.error("[CREATE_LOCATION_CHECK_IN]", error)
    return to(error)
  }
}

export async function checkoutFromLocation(
  checkInId: string
): Promise<ActionResult<LocationCheckInWithLocation>> {
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

    // Verify the check-in exists and belongs to this user
    const checkIn = await prisma.locationCheckIn.findUnique({
      where: { id: checkInId },
    })

    if (!checkIn) {
      return { ok: false, message: "Check-in not found" }
    }

    if (checkIn.userId !== user.id) {
      return { ok: false, message: "Unauthorized" }
    }

    if (checkIn.checkOutTime) {
      return { ok: false, message: "Already checked out from this location" }
    }

    // Update with check-out time
    const updatedCheckIn = await prisma.locationCheckIn.update({
      where: { id: checkInId },
      data: {
        checkOutTime: new Date(),
      },
      include: {
        location: true,
      },
    })

    revalidatePath("/admin/dashboard")

    return { ok: true, data: updatedCheckIn }
  } catch (error) {
    console.error("[CHECKOUT_FROM_LOCATION]", error)
    return to(error)
  }
}
