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
          <main className="flex-1 p-6 md:p-8 lg:p-10">
            {/* Global Notifications */}
            <NotificationBanner className="mb-6" />

            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
