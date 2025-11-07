"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Bell, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { getNotifications, dismissNotification as dismissNotificationAction, type Notification } from "@/app/actions"

interface NotificationBannerProps {
  className?: string
}

const typeStyles: Record<Notification['type'], string> = {
  info: "border-blue-500 bg-blue-50 dark:bg-blue-950",
  warning: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
  success: "border-green-500 bg-green-50 dark:bg-green-950",
  error: "border-red-500 bg-red-50 dark:bg-red-950",
  alert: "border-orange-500 bg-orange-50 dark:bg-orange-950",
}

const typeIcons: Record<Notification['type'], any> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: AlertCircle,
  alert: Bell,
}

const priorityColors: Record<Notification['priority'], string> = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function NotificationBanner({ className }: NotificationBannerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const result = await getNotifications()
      if (result.success) {
        setNotifications(result.notifications || [])
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const dismissNotification = async (notificationId: string) => {
    try {
      // Optimistically remove from UI
      setNotifications(prev => prev.filter(n => n.id !== notificationId))

      // Send dismiss request to server
      const result = await dismissNotificationAction(notificationId)
      if (!result.success) {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Failed to dismiss notification:", error)
      // Re-fetch to restore state if dismiss failed
      fetchNotifications()
    }
  }

  if (isLoading || notifications.length === 0) {
    return null
  }

  // Sort by priority and date
  const sortedNotifications = [...notifications].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className={cn("space-y-2", className)}>
      {sortedNotifications.map((notification) => {
        const Icon = typeIcons[notification.type]
        return (
          <Alert
            key={notification.id}
            className={cn(
              "relative",
              typeStyles[notification.type],
              notification.priority === "urgent" && "animate-pulse"
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{notification.title}</p>
                  {notification.priority !== "low" && (
                    <Badge className={cn("text-xs", priorityColors[notification.priority])}>
                      {notification.priority.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <AlertDescription className="text-sm">
                  {notification.message}
                </AlertDescription>
                {notification.actionLabel && notification.actionUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    asChild
                  >
                    <a href={notification.actionUrl}>
                      {notification.actionLabel}
                    </a>
                  </Button>
                )}
              </div>
              {notification.dismissible !== false && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Alert>
        )
      })}
    </div>
  )
}
