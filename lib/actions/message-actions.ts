"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { to, type ActionResult } from "@/lib/utils/RenderError"
import { revalidatePath } from "next/cache"

// TypeScript types for return values
export interface MessageWithDetails {
  id: string
  content: string
  type: string
  senderId: string
  senderName: string
  createdAt: Date
  readAt: Date | null
  replyToId: string | null
}

export interface ConversationSummary {
  guardId: string
  guardName: string
  locationName: string | null
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
}

/**
 * Guards send message to all on-duty supervisors
 */
export async function sendGuardMessage(content: string): Promise<ActionResult<MessageWithDetails>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    // Verify guard role
    if (user.role !== "GUARD") {
      return { ok: false, message: "Only guards can send guard messages" }
    }

    // Verify user is on duty
    const dutySession = await prisma.dutySession.findFirst({
      where: {
        userId: user.id,
        clockOutTime: null,
      },
    })

    if (!dutySession) {
      return { ok: false, message: "You must be on duty to send messages" }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        type: "GUARD_TO_SUPERVISOR",
        senderId: user.id,
        dutySessionId: dutySession.id,
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Revalidate messages pages
    revalidatePath("/messages")
    revalidatePath("/admin/dashboard/messages")

    return {
      ok: true,
      data: {
        id: message.id,
        content: message.content,
        type: message.type,
        senderId: message.senderId,
        senderName: `${message.sender.firstName} ${message.sender.lastName}`,
        createdAt: message.createdAt,
        readAt: message.readAt,
        replyToId: message.replyToId,
      },
    }
  } catch (error) {
    console.error("[SEND_GUARD_MESSAGE]", error)
    return to(error)
  }
}

/**
 * Supervisors reply to guard messages
 */
export async function sendSupervisorReply(
  guardUserId: string,
  content: string,
  replyToId?: string
): Promise<ActionResult<MessageWithDetails>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    // Verify supervisor role
    if (
      user.role !== "SUPERVISOR" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { ok: false, message: "Only supervisors can send replies" }
    }

    // Verify supervisor is on duty
    const supervisorSession = await prisma.dutySession.findFirst({
      where: {
        userId: user.id,
        clockOutTime: null,
      },
    })

    if (!supervisorSession) {
      return { ok: false, message: "You must be on duty to send messages" }
    }

    // Find guard's active duty session
    const guardSession = await prisma.dutySession.findFirst({
      where: {
        userId: guardUserId,
        clockOutTime: null,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!guardSession) {
      return {
        ok: false,
        message: "Guard is not currently on duty",
      }
    }

    // Create message linked to guard's duty session
    const message = await prisma.message.create({
      data: {
        content,
        type: "SUPERVISOR_TO_GUARD",
        senderId: user.id,
        dutySessionId: guardSession.id,
        replyToId: replyToId || null,
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Revalidate messages pages
    revalidatePath("/messages")
    revalidatePath(`/admin/dashboard/messages/${guardUserId}`)

    return {
      ok: true,
      data: {
        id: message.id,
        content: message.content,
        type: message.type,
        senderId: message.senderId,
        senderName: `${message.sender.firstName} ${message.sender.lastName}`,
        createdAt: message.createdAt,
        readAt: message.readAt,
        replyToId: message.replyToId,
      },
    }
  } catch (error) {
    console.error("[SEND_SUPERVISOR_REPLY]", error)
    return to(error)
  }
}

/**
 * Get messages for current user's active duty session
 */
export async function getMyMessages(): Promise<ActionResult<MessageWithDetails[]>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    // Find active duty session
    const dutySession = await prisma.dutySession.findFirst({
      where: {
        userId: user.id,
        clockOutTime: null,
      },
    })

    if (!dutySession) {
      // Not on duty - no messages
      return { ok: true, data: [] }
    }

    // Get all messages for this duty session
    const messages = await prisma.message.findMany({
      where: {
        dutySessionId: dutySession.id,
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    const messageData = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      type: msg.type,
      senderId: msg.senderId,
      senderName: `${msg.sender.firstName} ${msg.sender.lastName}`,
      createdAt: msg.createdAt,
      readAt: msg.readAt,
      replyToId: msg.replyToId,
    }))

    return { ok: true, data: messageData }
  } catch (error) {
    console.error("[GET_MY_MESSAGES]", error)
    return to(error)
  }
}

/**
 * Supervisor-only: Get list of guards with messages
 */
export async function getGuardConversations(): Promise<ActionResult<ConversationSummary[]>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    // Verify supervisor role
    if (
      user.role !== "SUPERVISOR" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { ok: false, message: "Only supervisors can view conversations" }
    }

    // Get all on-duty guards with messages
    const guardSessions = await prisma.dutySession.findMany({
      where: {
        clockOutTime: null,
        user: {
          role: "GUARD",
        },
        messages: {
          some: {},
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        location: {
          select: {
            name: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    })

    // Build conversation summaries
    const conversations: ConversationSummary[] = await Promise.all(
      guardSessions.map(async (session) => {
        // Count unread messages (messages from guard that haven't been read)
        const unreadCount = await prisma.message.count({
          where: {
            dutySessionId: session.id,
            type: "GUARD_TO_SUPERVISOR",
            readAt: null,
          },
        })

        const lastMessage = session.messages[0]

        return {
          guardId: session.user.id,
          guardName: `${session.user.firstName} ${session.user.lastName}`,
          locationName: session.location?.name || "Roaming",
          lastMessage: lastMessage?.content || "",
          lastMessageTime: lastMessage?.createdAt || new Date(),
          unreadCount,
        }
      })
    )

    // Sort by most recent message first
    conversations.sort(
      (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    )

    return { ok: true, data: conversations }
  } catch (error) {
    console.error("[GET_GUARD_CONVERSATIONS]", error)
    return to(error)
  }
}

/**
 * Supervisor-only: Get full conversation thread with specific guard
 */
export async function getConversationThread(
  guardUserId: string
): Promise<ActionResult<MessageWithDetails[]>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    // Verify supervisor role
    if (
      user.role !== "SUPERVISOR" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return { ok: false, message: "Only supervisors can view conversations" }
    }

    // Find guard's active duty session
    const guardSession = await prisma.dutySession.findFirst({
      where: {
        userId: guardUserId,
        clockOutTime: null,
      },
    })

    if (!guardSession) {
      return {
        ok: false,
        message: "Guard is not currently on duty or has no active session",
      }
    }

    // Get all messages for this guard's duty session
    const messages = await prisma.message.findMany({
      where: {
        dutySessionId: guardSession.id,
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    const messageData = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      type: msg.type,
      senderId: msg.senderId,
      senderName: `${msg.sender.firstName} ${msg.sender.lastName}`,
      createdAt: msg.createdAt,
      readAt: msg.readAt,
      replyToId: msg.replyToId,
    }))

    return { ok: true, data: messageData }
  } catch (error) {
    console.error("[GET_CONVERSATION_THREAD]", error)
    return to(error)
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        dutySession: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!message) {
      return { ok: false, message: "Message not found" }
    }

    // Only the message recipient (duty session owner) or supervisors can mark as read
    const canMarkAsRead =
      message.dutySession.userId === user.id ||
      user.role === "SUPERVISOR" ||
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN"

    if (!canMarkAsRead) {
      return { ok: false, message: "Unauthorized to mark this message as read" }
    }

    // Update message
    await prisma.message.update({
      where: { id: messageId },
      data: {
        readAt: new Date(),
      },
    })

    // Revalidate pages
    revalidatePath("/messages")
    revalidatePath("/admin/dashboard/messages")

    return { ok: true, data: undefined }
  } catch (error) {
    console.error("[MARK_MESSAGE_AS_READ]", error)
    return to(error)
  }
}
