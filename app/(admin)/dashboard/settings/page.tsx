import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/sync-user'
import { isAdmin } from '@/lib/utils/auth'
import { SettingsPageClient } from '@/components/settings/settings-page-client'
import { getActiveLocations } from '@/lib/actions/location-actions'

export const metadata = {
  title: 'Settings | Admin Dashboard',
  description: 'Manage system settings and configurations',
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const user = await getCurrentUser()

  if (!user) redirect('/sign-in')
  if (!isAdmin(user.role)) redirect('/')

  const locationsResult = await getActiveLocations()
  const locations = locationsResult.ok ? locationsResult.data.map(l => ({ id: l.id, name: l.name })) : []

  const { tab } = await searchParams

  return <SettingsPageClient user={user} locations={locations} initialTab={tab} />
}
