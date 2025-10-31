import { MobileNav } from "@/components/layouts/public/mobile-nav"
import { MobileHeader } from "@/components/layouts/public/mobile-header"
import { NotificationBanner } from "@/components/notifications/notification-banner"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MobileHeader title="Marina Guard" />

      {/* Main content with bottom padding for mobile nav */}
      <main className="flex-1 pb-20 px-4 py-6 overflow-y-auto">
        {/* Global Notifications */}
        <NotificationBanner className="mb-4" />

        {children}
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  )
}
