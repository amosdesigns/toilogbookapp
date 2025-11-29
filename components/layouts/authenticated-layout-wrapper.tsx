"use client"

import { NotificationBanner } from "@/components/notifications/notification-banner"

interface AuthenticatedLayoutWrapperProps {
  children: React.ReactNode
}

export function AuthenticatedLayoutWrapper({ children }: AuthenticatedLayoutWrapperProps) {
  return (
    <>
      <NotificationBanner className="mb-4" />
      {children}
    </>
  )
}
