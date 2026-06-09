import { MobileNav } from "@/components/layouts/public/mobile-nav"
import { MobileHeader } from "@/components/layouts/public/mobile-header"
import { AuthenticatedLayoutWrapper } from "@/components/layouts/authenticated-layout-wrapper"
import { getCurrentUserWithSync } from "@/lib/auth/sync-user"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUserWithSync()

  if (!user) {
    redirect("/sign-in")
  }

  // Non-guards belong in the admin interface
  if (user.role !== "GUARD") {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MobileHeader title="Marina Guard" user={user} />

      {/* Main content with bottom padding for mobile nav */}
      <main className="flex-1 pb-20 px-4 py-6 overflow-y-auto">
        <AuthenticatedLayoutWrapper>
          {children}
        </AuthenticatedLayoutWrapper>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  )
}
