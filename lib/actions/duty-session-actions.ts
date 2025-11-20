"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getActiveDutySession() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Unauthorized", dutySession: null }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: "User not found", dutySession: null }
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

    return { success: true, dutySession: activeDutySession }
  } catch (error) {
    console.error("[GET_ACTIVE_DUTY_SESSION]", error)
    return { success: false, error: "Failed to fetch duty session", dutySession: null }
  }
}

export async function clockIn(data: { locationId?: string; shiftId?: string }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Check if user already has an active duty session
    const existingSession = await prisma.dutySession.findFirst({
      where: {
        userId: user.id,
        clockOutTime: null,
      },
    })

    if (existingSession) {
      return { success: false, error: "Already on duty. Please sign off first." }
    }

    // Validate locationId for guards
    if (user.role === "GUARD" && !data.locationId) {
      return { success: false, error: "Guards must select a location" }
    }

    // Supervisors should have null locationId (roaming)
    let locationId = data.locationId
    if (
      (user.role === "SUPERVISOR" ||
        user.role === "ADMIN" ||
        user.role === "SUPER_ADMIN") &&
      data.locationId
    ) {
      locationId = undefined // Force null for roaming duty
    }

    // Create duty session
    const dutySession = await prisma.dutySession.create({
      data: {
        userId: user.id,
        locationId: locationId || null,
        shiftId: data.shiftId || null,
      },
      include: {
        location: true,
        shift: true,
      },
    })

    revalidatePath("/")
    revalidatePath("/admin/dashboard")

    return { success: true, dutySession }
  } catch (error) {
    console.error("[CLOCK_IN]", error)
    return { success: false, error: "Failed to clock in" }
  }
}

export async function clockOut(dutySessionId: string, notes?: string) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Get duty session
    const dutySession = await prisma.dutySession.findUnique({
      where: { id: dutySessionId },
    })

    if (!dutySession) {
      return { success: false, error: "Duty session not found" }
    }

    // Verify ownership
    if (dutySession.userId !== user.id) {
      return { success: false, error: "Unauthorized" }
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

    return { success: true, dutySession: updatedSession }
  } catch (error) {
    console.error("[CLOCK_OUT]", error)
    return { success: false, error: "Failed to clock out" }
  }
}

export async function supervisorClockOut(dutySessionId: string) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Verify supervisor role
    if (
      user.role !== "SUPERVISOR" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { success: false, error: "Only supervisors can override clock out" }
    }

    // Get duty session
    const dutySession = await prisma.dutySession.findUnique({
      where: { id: dutySessionId },
    })

    if (!dutySession) {
      return { success: false, error: "Duty session not found" }
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

    return { success: true, dutySession: updatedSession }
  } catch (error) {
    console.error("[SUPERVISOR_CLOCK_OUT]", error)
    return { success: false, error: "Failed to clock out" }
  }
}

export async function createLocationCheckIn(
  dutySessionId: string,
  locationId: string,
  notes?: string
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: "User not found" }
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

    return { success: true, checkIn }
  } catch (error) {
    console.error("[CREATE_LOCATION_CHECK_IN]", error)
    return { success: false, error: "Failed to record check-in" }
  }
}
