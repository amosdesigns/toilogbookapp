'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/sync-user'
import { to, type ActionResult } from '@/lib/utils/RenderError'

export async function getActiveLocations(): Promise<ActionResult<Array<{ id: string; name: string }>>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    const locations = await prisma.location.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    return { ok: true, data: locations }
  } catch (error) {
    console.error('Error fetching locations:', error)
    return to(error)
  }
}
