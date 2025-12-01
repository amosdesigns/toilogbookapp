"use server"

import { prisma } from "@/lib/prisma"
import { to, type ActionResult } from "@/lib/utils/RenderError"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/utils/auth"
import {
  createLocationSchema,
  updateLocationSchema,
  type CreateLocationInput,
  type UpdateLocationInput,
} from "@/lib/validations/location"

export async function getActiveLocations(): Promise<ActionResult<any>> {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    })

    return { ok: true, data: locations }
  } catch (error) {
    console.error("[GET_ACTIVE_LOCATIONS]", error)
    return to(error)
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

// ============================================================================
// ADMIN MANAGEMENT ACTIONS
// ============================================================================

export interface Location {
  id: string
  name: string
  description: string | null
  address: string | null
  maxCapacity: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Get all locations (including inactive) with full details - Admin only
 */
export async function getAllLocationsAdmin(): Promise<ActionResult<Location[]>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    if (!isAdmin(user.role)) {
      return { ok: false, message: "Admin access required" }
    }

    const locations = await prisma.location.findMany({
      orderBy: { name: "asc" },
    })

    return {
      ok: true,
      data: locations,
    }
  } catch (error) {
    console.error("Error fetching all locations:", error)
    return to(error)
  }
}

/**
 * Create a new location - Admin only
 */
export async function createLocation(input: CreateLocationInput): Promise<ActionResult<Location>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    if (!isAdmin(user.role)) {
      return { ok: false, message: "Admin access required" }
    }

    // Validate input
    const validation = createLocationSchema.safeParse(input)
    if (!validation.success) {
      return {
        ok: false,
        message: "Invalid input",
        meta: { errors: validation.error.flatten() },
      }
    }

    // Check for duplicate name
    const existing = await prisma.location.findUnique({
      where: { name: validation.data.name },
    })

    if (existing) {
      return { ok: false, message: "A location with this name already exists" }
    }

    const location = await prisma.location.create({
      data: validation.data,
    })

    revalidatePath("/admin/dashboard/settings")
    revalidatePath("/")

    return {
      ok: true,
      data: location,
      message: "Location created successfully",
    }
  } catch (error) {
    console.error("Error creating location:", error)
    return to(error)
  }
}

/**
 * Update a location - Admin only
 */
export async function updateLocation(
  id: string,
  input: UpdateLocationInput
): Promise<ActionResult<Location>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    if (!isAdmin(user.role)) {
      return { ok: false, message: "Admin access required" }
    }

    // Validate input
    const validation = updateLocationSchema.safeParse(input)
    if (!validation.success) {
      return {
        ok: false,
        message: "Invalid input",
        meta: { errors: validation.error.flatten() },
      }
    }

    // Check location exists
    const existing = await prisma.location.findUnique({
      where: { id },
    })

    if (!existing) {
      return { ok: false, message: "Location not found" }
    }

    // Check for duplicate name if name is being updated
    if (validation.data.name && validation.data.name !== existing.name) {
      const duplicate = await prisma.location.findFirst({
        where: { name: validation.data.name, id: { not: id } },
      })

      if (duplicate) {
        return { ok: false, message: "A location with this name already exists" }
      }
    }

    const location = await prisma.location.update({
      where: { id },
      data: validation.data,
    })

    revalidatePath("/admin/dashboard/settings")
    revalidatePath("/")

    return {
      ok: true,
      data: location,
      message: "Location updated successfully",
    }
  } catch (error) {
    console.error("Error updating location:", error)
    return to(error)
  }
}

/**
 * Delete (soft delete) a location - Admin only
 */
export async function deleteLocation(id: string): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    if (!isAdmin(user.role)) {
      return { ok: false, message: "Admin access required" }
    }

    // Check location exists
    const existing = await prisma.location.findUnique({
      where: { id },
    })

    if (!existing) {
      return { ok: false, message: "Location not found" }
    }

    // Soft delete by setting isActive to false
    await prisma.location.update({
      where: { id },
      data: { isActive: false },
    })

    revalidatePath("/admin/dashboard/settings")
    revalidatePath("/")

    return {
      ok: true,
      data: undefined,
      message: "Location deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting location:", error)
    return to(error)
  }
}
