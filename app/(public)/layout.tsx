import { MobileNav } from "@/components/layouts/public/mobile-nav"
import { MobileHeader } from "@/components/layouts/public/mobile-header"
import { NotificationBanner } from "@/components/notifications/notification-banner"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { redirect } from "next/navigation"

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MobileHeader title="Marina Guard" user={user} />

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
