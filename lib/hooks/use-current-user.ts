import { useUser } from '@clerk/nextjs'
import { Role } from '@/types'

export function useCurrentUser() {
  const { user, isLoaded, isSignedIn } = useUser()

  const role = (user?.publicMetadata?.role as Role) || 'GUARD'

  return {
    user,
    isLoaded,
    isSignedIn,
    role,
  }
}
