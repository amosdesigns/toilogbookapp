"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// Note: This assumes you have a Message model in your schema
// If not, you'll need to add it or remove this file

export async function sendMessage(recipientId: string, message: string) {
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
      return { success: false, error: "Only supervisors can send messages" }
    }

    // TODO: Implement message sending based on your schema
    // For now, just logging
    console.log(`Message from ${user.id} to ${recipientId}: ${message}`)

    return { success: true }
  } catch (error) {
    console.error("[SEND_MESSAGE]", error)
    return { success: false, error: "Failed to send message" }
  }
}
