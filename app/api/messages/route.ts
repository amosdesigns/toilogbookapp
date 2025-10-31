import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Only supervisors and above can send messages
    if (!['SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { recipientId, message } = body

    if (!recipientId || !message) {
      return NextResponse.json(
        { error: "Recipient and message are required" },
        { status: 400 }
      )
    }

    // In production, you would:
    // 1. Store message in a Messages table
    // 2. Create a notification for the recipient
    // 3. Possibly send real-time notification via WebSocket/SSE
    // 4. Maybe send email/SMS depending on urgency

    // For now, we'll just log it and return success
    console.log(`Message from ${currentUser.id} to ${recipientId}: ${message}`)

    // TODO: Implement actual message storage and notification system
    // const messageRecord = await prisma.message.create({
    //   data: {
    //     senderId: currentUser.id,
    //     recipientId,
    //     content: message,
    //   },
    // })

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}
