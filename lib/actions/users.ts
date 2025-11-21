'use server'

import { getCurrentUser } from '@/lib/auth/sync-user'
import { to, type Result } from '@/lib/utils/RenderError'

export async function getCurrentUserAction(): Promise<Result<any>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    return { ok: true, data: user }
  } catch (error) {
    console.error('Error fetching current user:', error)
    return to(error)
  }
}
