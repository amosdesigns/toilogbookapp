import { AdminSidebar } from "@/components/layouts/admin/admin-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { NotificationBanner } from "@/components/notifications/notification-banner"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
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
