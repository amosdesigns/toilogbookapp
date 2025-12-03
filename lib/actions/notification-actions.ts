"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { to, type ActionResult } from "@/lib/utils/RenderError"

export interface NotificationData {
  id: string
  type: "info" | "warning" | "success" | "error" | "alert"
  priority: "low" | "medium" | "high" | "urgent"
  title: string
  message: string
  actionLabel?: string | null
  actionUrl?: string | null
  dismissible: boolean
  createdAt: Date
}

export async function getNotifications(): Promise<ActionResult<NotificationData[]>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    // Get notifications for this user or global notifications (userId = null)
    // Only show non-dismissed notifications
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: user.id },    // User-specific notifications
          { userId: null }        // Global notifications for all users
        ],
        dismissedAt: null         // Not dismissed
      },
      orderBy: [
        { priority: 'asc' },      // urgent=0, high=1, medium=2, low=3 (alphabetical)
        { createdAt: 'desc' }     // Newest first
      ],
      take: 10 // Limit to 10 most important notifications
    })

    // Map Prisma notification to component format
    const notificationData: NotificationData[] = notifications.map(n => ({
      id: n.id,
      type: n.type.toLowerCase() as NotificationData['type'],
      priority: n.priority.toLowerCase() as NotificationData['priority'],
      title: n.title,
      message: n.message,
      actionLabel: n.actionLabel,
      actionUrl: n.actionUrl,
      dismissible: n.dismissible,
      createdAt: n.createdAt
    }))

    return { ok: true, data: notificationData }
  } catch (error) {
    console.error("[GET_NOTIFICATIONS]", error)
    return to(error)
  }
}

export async function dismissNotification(notificationId: string): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    // Verify notification belongs to user or is global
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    })

    if (!notification) {
      return { ok: false, message: "Notification not found" }
    }

    // Check if user can dismiss (must be their notification or a global one)
    if (notification.userId && notification.userId !== user.id) {
      return { ok: false, message: "Cannot dismiss another user's notification" }
    }

    // Mark as dismissed
    await prisma.notification.update({
      where: { id: notificationId },
      data: { dismissedAt: new Date() }
    })

    return { ok: true, data: undefined }
  } catch (error) {
    console.error("[DISMISS_NOTIFICATION]", error)
    return to(error)
  }
}
