"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { to, type ActionResult } from "@/lib/utils/RenderError"

export async function reviewIncident(incidentId: string, reviewNotes: string): Promise<ActionResult<any>> {
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
      return { ok: false, message: "Only supervisors can review incidents" }
    }

    // Update incident with review
    const updatedIncident = await prisma.log.update({
      where: { id: incidentId },
      data: {
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewNotes,
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
    })

    revalidatePath("/admin/dashboard")

    return { ok: true, data: updatedIncident }
  } catch (error) {
    console.error("[REVIEW_INCIDENT]", error)
    return to(error)
  }
}
