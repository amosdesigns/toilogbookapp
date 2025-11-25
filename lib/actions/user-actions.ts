"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { to, type Result } from "@/lib/utils/RenderError"

// Get current user from database
export async function getCurrentUser(): Promise<Result<any>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        streetAddress: true,
        city: true,
        state: true,
        zipCode: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return { ok: false, message: "User not found" }
    }

    return { ok: true, data: user }
  } catch (error) {
    console.error("[GET_CURRENT_USER]", error)
    return to(error)
  }
}

// Get all users (for admin/supervisor use)
export async function getUsers(): Promise<Result<any>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    // Get current user to check permissions
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!currentUser) {
      return { ok: false, message: "User not found" }
    }

    // Only supervisors and above can view all users
    if (
      currentUser.role !== "SUPERVISOR" &&
      currentUser.role !== "ADMIN" &&
      currentUser.role !== "SUPER_ADMIN"
    ) {
      return { ok: false, message: "Unauthorized to view users" }
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { firstName: "asc" }],
    })

    return { ok: true, data: users }
  } catch (error) {
    console.error("[GET_USERS]", error)
    return to(error)
  }
}
