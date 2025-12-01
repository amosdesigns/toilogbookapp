"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { to, type ActionResult } from "@/lib/utils/RenderError"

// Get shifts with optional filtering
export async function getShifts(params?: {
  startDate?: string
  endDate?: string
  locationId?: string
}): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    const whereClause: any = {}

    if (params?.startDate || params?.endDate) {
      whereClause.startTime = {}
      if (params.startDate) {
        whereClause.startTime.gte = new Date(params.startDate)
      }
      if (params.endDate) {
        whereClause.startTime.lte = new Date(params.endDate)
      }
    }

    if (params?.locationId) {
      whereClause.locationId = params.locationId
    }

    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
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
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    })

    return { ok: true, data: shifts }
  } catch (error) {
    console.error("[GET_SHIFTS]", error)
    return to(error)
  }
}

// Create a new shift
export async function createShift(data: {
  name: string
  startTime: string
  endTime: string
  locationId: string
  userAssignments?: Array<{ userId: string; role?: string | null }>
}): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    // Get user from database to check role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { ok: false, message: "User not found" }
    }

    // Only Supervisor, Admin, and Super Admin can create shifts
    if (
      user.role !== "SUPERVISOR" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { ok: false, message: "Unauthorized to create shifts" }
    }

    const shift = await prisma.shift.create({
      data: {
        name: data.name,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        locationId: data.locationId,
        assignments: data.userAssignments
          ? {
              create: data.userAssignments.map((assignment) => ({
                userId: assignment.userId,
                role: assignment.role || null,
              })),
            }
          : undefined,
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
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
          },
        },
      },
    })

    revalidatePath("/admin/dashboard/shifts")

    return { ok: true, data: shift }
  } catch (error) {
    console.error("[CREATE_SHIFT]", error)
    return to(error)
  }
}

// Update an existing shift
export async function updateShift(
  shiftId: string,
  data: {
    name?: string
    startTime?: string
    endTime?: string
    locationId?: string
    userAssignments?: Array<{ userId: string; role?: string | null }>
  }
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    // Get user from database to check role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { ok: false, message: "User not found" }
    }

    // Only Supervisor, Admin, and Super Admin can update shifts
    if (
      user.role !== "SUPERVISOR" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { ok: false, message: "Unauthorized to update shifts" }
    }

    // If user assignments are provided, replace all assignments
    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.startTime) updateData.startTime = new Date(data.startTime)
    if (data.endTime) updateData.endTime = new Date(data.endTime)
    if (data.locationId) updateData.locationId = data.locationId

    if (data.userAssignments !== undefined) {
      // Delete existing assignments and create new ones
      await prisma.shiftAssignment.deleteMany({
        where: { shiftId },
      })

      updateData.assignments = {
        create: data.userAssignments.map((assignment) => ({
          userId: assignment.userId,
          role: assignment.role || null,
        })),
      }
    }

    const shift = await prisma.shift.update({
      where: { id: shiftId },
      data: updateData,
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
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
          },
        },
      },
    })

    revalidatePath("/admin/dashboard/shifts")

    return { ok: true, data: shift }
  } catch (error) {
    console.error("[UPDATE_SHIFT]", error)
    return to(error)
  }
}

// Delete a shift
export async function deleteShift(shiftId: string): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    // Get user from database to check role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { ok: false, message: "User not found" }
    }

    // Only Admin and Super Admin can delete shifts
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return { ok: false, message: "Unauthorized to delete shifts" }
    }

    await prisma.shift.delete({
      where: { id: shiftId },
    })

    revalidatePath("/admin/dashboard/shifts")

    return { ok: true, data: null, message: "Shift deleted successfully" }
  } catch (error) {
    console.error("[DELETE_SHIFT]", error)
    return to(error)
  }
}

// Get recurring shift patterns
export async function getRecurringPatterns(
  locationId?: string
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    const whereClause: any = {}
    if (locationId) {
      whereClause.locationId = locationId
    }

    const patterns = await prisma.recurringShiftPattern.findMany({
      where: whereClause,
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        userAssignments: {
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { ok: true, data: patterns }
  } catch (error) {
    console.error("[GET_RECURRING_PATTERNS]", error)
    return to(error)
  }
}

// Create a recurring shift pattern
export async function createRecurringPattern(data: {
  name: string
  locationId: string
  startTime: string
  endTime: string
  daysOfWeek: number[]
  startDate: string
  endDate?: string
  userAssignments?: Array<{ userId: string; role?: string | null }>
}): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    // Get user from database to check role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { ok: false, message: "User not found" }
    }

    // Only Supervisor, Admin, and Super Admin can create recurring patterns
    if (
      user.role !== "SUPERVISOR" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { ok: false, message: "Unauthorized to create recurring patterns" }
    }

    const pattern = await prisma.recurringShiftPattern.create({
      data: {
        name: data.name,
        locationId: data.locationId,
        startTime: data.startTime,
        endTime: data.endTime,
        daysOfWeek: JSON.stringify(data.daysOfWeek),
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: true,
        userAssignments: data.userAssignments
          ? {
              create: data.userAssignments.map((assignment) => ({
                userId: assignment.userId,
                role: assignment.role || null,
              })),
            }
          : undefined,
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        userAssignments: {
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
          },
        },
      },
    })

    revalidatePath("/admin/dashboard/shifts")

    return { ok: true, data: pattern }
  } catch (error) {
    console.error("[CREATE_RECURRING_PATTERN]", error)
    return to(error)
  }
}

// Update a recurring shift pattern
export async function updateRecurringPattern(
  patternId: string,
  data: {
    name?: string
    locationId?: string
    startTime?: string
    endTime?: string
    daysOfWeek?: number[]
    startDate?: string
    endDate?: string | null
    isActive?: boolean
    userAssignments?: Array<{ userId: string; role?: string | null }>
  }
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    // Get user from database to check role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { ok: false, message: "User not found" }
    }

    // Only Supervisor, Admin, and Super Admin can update recurring patterns
    if (
      user.role !== "SUPERVISOR" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return {
        ok: false,
        message: "Unauthorized to update recurring patterns",
      }
    }

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.locationId) updateData.locationId = data.locationId
    if (data.startTime) updateData.startTime = data.startTime
    if (data.endTime) updateData.endTime = data.endTime
    if (data.daysOfWeek) updateData.daysOfWeek = JSON.stringify(data.daysOfWeek)
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    if (data.userAssignments !== undefined) {
      // Delete existing assignments and create new ones
      await prisma.recurringUserAssignment.deleteMany({
        where: { recurringPatternId: patternId },
      })

      updateData.userAssignments = {
        create: data.userAssignments.map((assignment) => ({
          userId: assignment.userId,
          role: assignment.role || null,
        })),
      }
    }

    const pattern = await prisma.recurringShiftPattern.update({
      where: { id: patternId },
      data: updateData,
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        userAssignments: {
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
          },
        },
      },
    })

    revalidatePath("/admin/dashboard/shifts")

    return { ok: true, data: pattern }
  } catch (error) {
    console.error("[UPDATE_RECURRING_PATTERN]", error)
    return to(error)
  }
}

// Delete a recurring shift pattern
export async function deleteRecurringPattern(
  patternId: string
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    // Get user from database to check role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { ok: false, message: "User not found" }
    }

    // Only Admin and Super Admin can delete recurring patterns
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return {
        ok: false,
        message: "Unauthorized to delete recurring patterns",
      }
    }

    await prisma.recurringShiftPattern.delete({
      where: { id: patternId },
    })

    revalidatePath("/admin/dashboard/shifts")

    return { ok: true, data: null, message: "Recurring pattern deleted successfully" }
  } catch (error) {
    console.error("[DELETE_RECURRING_PATTERN]", error)
    return to(error)
  }
}
