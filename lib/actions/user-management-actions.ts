"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { to, type ActionResult } from "@/lib/utils/RenderError"
import { revalidatePath } from "next/cache"
import type { UserRole } from "@/lib/types"

// Type for user with all fields for management table
export interface UserManagementData {
  id: string
  clerkId: string
  email: string
  username: string | null
  firstName: string
  lastName: string
  imageUrl: string | null
  phone: string | null
  streetAddress: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  role: UserRole
  createdAt: Date
  updatedAt: Date
  archivedAt: Date | null
}

// Get all users for management (ADMIN and SUPER_ADMIN only)
export async function getAllUsersForManagement(
  searchTerm?: string,
  page = 1,
  pageSize = 25
): Promise<ActionResult<{ users: UserManagementData[]; total: number }>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })

    if (!currentUser) {
      return { ok: false, message: "User not found" }
    }

    // Only ADMIN and SUPER_ADMIN can access user management
    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return { ok: false, message: "Unauthorized - Admin access required" }
    }

    // Build where clause for search
    // Split search term into words for better matching (e.g., "jerome amos" finds "Jerome Amos")
    const where = searchTerm
      ? {
          OR: searchTerm
            .trim()
            .split(/\s+/) // Split by whitespace
            .flatMap((word) => [
              { firstName: { contains: word, mode: "insensitive" as const } },
              { lastName: { contains: word, mode: "insensitive" as const } },
              { email: { contains: word, mode: "insensitive" as const } },
            ]),
        }
      : {}

    // Get total count
    const total = await prisma.user.count({ where })

    // Get paginated users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        clerkId: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        phone: true,
        streetAddress: true,
        city: true,
        state: true,
        zipCode: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        archivedAt: true,
      },
      orderBy: [
        { archivedAt: "asc" }, // Active users first
        { role: "asc" }, // Then by role
        { firstName: "asc" }, // Then alphabetically
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return { ok: true, data: { users, total } }
  } catch (error) {
    console.error("[GET_ALL_USERS_FOR_MANAGEMENT]", error)
    return to(error)
  }
}

// Update user role (ADMIN and SUPER_ADMIN only)
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<ActionResult<UserManagementData>> {
  try {
    const { userId: currentUserId } = await auth()

    if (!currentUserId) {
      return { ok: false, message: "Unauthorized" }
    }

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: currentUserId },
      select: { role: true },
    })

    if (!currentUser) {
      return { ok: false, message: "Current user not found" }
    }

    // Only ADMIN and SUPER_ADMIN can update roles
    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return { ok: false, message: "Unauthorized - Admin access required" }
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, clerkId: true, role: true },
    })

    if (!targetUser) {
      return { ok: false, message: "User not found" }
    }

    // Update user role in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        clerkId: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        phone: true,
        streetAddress: true,
        city: true,
        state: true,
        zipCode: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        archivedAt: true,
      },
    })

    // NOTE: We do NOT update Clerk metadata - roles are only stored in the database
    // Database is the single source of truth for roles

    revalidatePath("/dashboard/users")

    return { ok: true, data: updatedUser }
  } catch (error) {
    console.error("[UPDATE_USER_ROLE]", error)
    return to(error)
  }
}

// Archive user (ADMIN and SUPER_ADMIN only)
export async function archiveUser(userId: string): Promise<ActionResult<UserManagementData>> {
  try {
    const { userId: currentUserId } = await auth()

    if (!currentUserId) {
      return { ok: false, message: "Unauthorized" }
    }

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: currentUserId },
      select: { id: true, role: true },
    })

    if (!currentUser) {
      return { ok: false, message: "Current user not found" }
    }

    // Only ADMIN and SUPER_ADMIN can archive
    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return { ok: false, message: "Unauthorized - Admin access required" }
    }

    // Prevent self-archive
    if (currentUser.id === userId) {
      return { ok: false, message: "Cannot archive yourself" }
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { clerkId: true },
    })

    if (!targetUser) {
      return { ok: false, message: "User not found" }
    }

    // Archive user in database
    const archivedUser = await prisma.user.update({
      where: { id: userId },
      data: { archivedAt: new Date() },
      select: {
        id: true,
        clerkId: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        phone: true,
        streetAddress: true,
        city: true,
        state: true,
        zipCode: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        archivedAt: true,
      },
    })

    // NOTE: We do NOT update Clerk metadata - archive status is only stored in the database
    // Database is the single source of truth

    revalidatePath("/dashboard/users")

    return { ok: true, data: archivedUser }
  } catch (error) {
    console.error("[ARCHIVE_USER]", error)
    return to(error)
  }
}

// Unarchive user (SUPER_ADMIN only)
export async function unarchiveUser(userId: string): Promise<ActionResult<UserManagementData>> {
  try {
    const { userId: currentUserId } = await auth()

    if (!currentUserId) {
      return { ok: false, message: "Unauthorized" }
    }

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: currentUserId },
      select: { role: true },
    })

    if (!currentUser) {
      return { ok: false, message: "Current user not found" }
    }

    // Only SUPER_ADMIN can unarchive
    if (currentUser.role !== "SUPER_ADMIN") {
      return { ok: false, message: "Unauthorized - Super Admin access required" }
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { clerkId: true },
    })

    if (!targetUser) {
      return { ok: false, message: "User not found" }
    }

    // Unarchive user in database
    const unarchivedUser = await prisma.user.update({
      where: { id: userId },
      data: { archivedAt: null },
      select: {
        id: true,
        clerkId: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        phone: true,
        streetAddress: true,
        city: true,
        state: true,
        zipCode: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        archivedAt: true,
      },
    })

    // NOTE: We do NOT update Clerk metadata - archive status is only stored in the database
    // Database is the single source of truth

    revalidatePath("/dashboard/users")

    return { ok: true, data: unarchivedUser }
  } catch (error) {
    console.error("[UNARCHIVE_USER]", error)
    return to(error)
  }
}
