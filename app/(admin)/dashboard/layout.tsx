import { AdminSidebar } from "@/components/layouts/admin/admin-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AuthenticatedLayoutWrapper } from "@/components/layouts/authenticated-layout-wrapper"
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
        <SidebarInset className="flex flex-col flex-1">
          <header className="flex h-14 items-center gap-4 border-b px-4 lg:h-16 lg:px-6 shrink-0">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-6 overflow-auto">
            <AuthenticatedLayoutWrapper>
              {children}
            </AuthenticatedLayoutWrapper>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
