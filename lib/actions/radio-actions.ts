'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/sync-user'
import { isAdmin } from '@/lib/utils/auth'
import { revalidatePath } from 'next/cache'
import { to, type Result } from '@/lib/utils/RenderError'
import { radioSchema } from '@/lib/validations/radio'
import type { Radio, Location } from '@prisma/client'

export type RadioWithLocation = Radio & { location: Location | null }

export async function getRadios(): Promise<Result<RadioWithLocation[]>> {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) return { ok: false, message: 'Unauthorized' }

    const radios = await prisma.radio.findMany({
      where: { archivedAt: null },
      include: { location: true },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    })
    return { ok: true, data: radios }
  } catch (error) {
    console.error('[GET_RADIOS]', error)
    return to(error)
  }
}

export async function createRadio(data: unknown): Promise<Result<Radio>> {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) return { ok: false, message: 'Unauthorized' }

    const parsed = radioSchema.safeParse(data)
    if (!parsed.success) return { ok: false, message: 'Invalid data', meta: { errors: parsed.error.flatten() } }

    const { name, serialNumber, model, channel, status, locationId, notes } = parsed.data

    const radio = await prisma.radio.create({
      data: {
        name,
        serialNumber: serialNumber || null,
        model: model || null,
        channel: channel || null,
        status,
        locationId: locationId || null,
        notes: notes || null,
      },
    })

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    return { ok: true, data: radio, message: 'Radio added successfully' }
  } catch (error) {
    console.error('[CREATE_RADIO]', error)
    return to(error)
  }
}

export async function updateRadio(id: string, data: unknown): Promise<Result<Radio>> {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) return { ok: false, message: 'Unauthorized' }

    const existing = await prisma.radio.findUnique({ where: { id } })
    if (!existing || existing.archivedAt) return { ok: false, message: 'Radio not found' }

    const parsed = radioSchema.safeParse(data)
    if (!parsed.success) return { ok: false, message: 'Invalid data', meta: { errors: parsed.error.flatten() } }

    const { name, serialNumber, model, channel, status, locationId, notes } = parsed.data

    const radio = await prisma.radio.update({
      where: { id },
      data: {
        name,
        serialNumber: serialNumber || null,
        model: model || null,
        channel: channel || null,
        status,
        locationId: locationId || null,
        notes: notes || null,
      },
    })

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    return { ok: true, data: radio, message: 'Radio updated successfully' }
  } catch (error) {
    console.error('[UPDATE_RADIO]', error)
    return to(error)
  }
}

export async function deleteRadio(id: string): Promise<Result<Radio>> {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) return { ok: false, message: 'Unauthorized' }

    const radio = await prisma.radio.update({
      where: { id },
      data: { archivedAt: new Date() },
    })

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    return { ok: true, data: radio, message: 'Radio removed' }
  } catch (error) {
    console.error('[DELETE_RADIO]', error)
    return to(error)
  }
}
