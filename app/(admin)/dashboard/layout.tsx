import { AdminSidebar } from "@/components/layouts/admin/admin-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { NotificationBanner } from "@/components/notifications/notification-banner"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar user={user} />
        <SidebarInset>
          <main className="flex-1 p-4 md:p-6 lg:p-6">
            {/* Global Notifications */}
            <NotificationBanner className="mb-4" />

            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
