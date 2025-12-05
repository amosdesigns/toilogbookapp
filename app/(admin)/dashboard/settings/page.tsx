import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/sync-user'
import { isAdmin } from '@/lib/utils/auth'
import { SettingsPageClient } from '@/components/settings/settings-page-client'

export const metadata = {
  title: 'Settings | Admin Dashboard',
  description: 'Manage system settings and configurations',
}

export default async function SettingsPage() {
  // Server-side authentication and authorization check
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (!isAdmin(user.role)) {
    redirect('/')
  }

  // Pass user data to client component
  return <SettingsPageClient user={user} />
}
