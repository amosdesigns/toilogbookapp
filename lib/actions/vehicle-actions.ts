'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/sync-user'
import { isAdmin } from '@/lib/utils/auth'
import { revalidatePath } from 'next/cache'
import { to, type Result } from '@/lib/utils/RenderError'
import { vehicleSchema, updateVehicleSchema } from '@/lib/validations/vehicle'
import type { Vehicle, Location } from '@prisma/client'

export type VehicleWithLocation = Vehicle & { location: Location | null }

export async function getVehicles(): Promise<Result<VehicleWithLocation[]>> {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) return { ok: false, message: 'Unauthorized' }

    const vehicles = await prisma.vehicle.findMany({
      where: { archivedAt: null },
      include: { location: true },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    })
    return { ok: true, data: vehicles }
  } catch (error) {
    console.error('[GET_VEHICLES]', error)
    return to(error)
  }
}

export async function getFleetInShop(): Promise<Result<{ vehicles: VehicleWithLocation[]; radios: (import('@prisma/client').Radio & { location: import('@prisma/client').Location | null })[] }>> {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) return { ok: false, message: 'Unauthorized' }

    const [vehicles, radios] = await Promise.all([
      prisma.vehicle.findMany({
        where: { status: 'OUT_OF_SERVICE', archivedAt: null },
        include: { location: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.radio.findMany({
        where: { status: 'OUT_OF_SERVICE', archivedAt: null },
        include: { location: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ])
    return { ok: true, data: { vehicles, radios } }
  } catch (error) {
    console.error('[GET_FLEET_IN_SHOP]', error)
    return to(error)
  }
}

export async function createVehicle(data: unknown): Promise<Result<Vehicle>> {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) return { ok: false, message: 'Unauthorized' }

    const parsed = vehicleSchema.safeParse(data)
    if (!parsed.success) return { ok: false, message: 'Invalid data', meta: { errors: parsed.error.flatten() } }

    const { name, make, model, year, vin, licensePlate, mileage, status, locationId, notes } = parsed.data

    const vehicle = await prisma.vehicle.create({
      data: {
        name, make, model, year,
        vin: vin || null,
        licensePlate: licensePlate || null,
        mileage,
        status,
        locationId: locationId || null,
        notes: notes || null,
        mileageUpdatedAt: mileage > 0 ? new Date() : null,
      },
    })

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    return { ok: true, data: vehicle, message: 'Vehicle added successfully' }
  } catch (error) {
    console.error('[CREATE_VEHICLE]', error)
    return to(error)
  }
}

export async function updateVehicle(id: string, data: unknown): Promise<Result<Vehicle>> {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) return { ok: false, message: 'Unauthorized' }

    const existing = await prisma.vehicle.findUnique({ where: { id } })
    if (!existing || existing.archivedAt) return { ok: false, message: 'Vehicle not found' }

    const parsed = updateVehicleSchema.safeParse(data)
    if (!parsed.success) return { ok: false, message: 'Invalid data', meta: { errors: parsed.error.flatten() } }

    const { name, make, model, year, vin, licensePlate, mileage, status, locationId, notes } = parsed.data
    const mileageChanged = mileage !== existing.mileage

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        name, make, model, year,
        vin: vin || null,
        licensePlate: licensePlate || null,
        mileage,
        mileageUpdatedAt: mileageChanged ? new Date() : existing.mileageUpdatedAt,
        status,
        locationId: locationId || null,
        notes: notes || null,
      },
    })

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    return { ok: true, data: vehicle, message: 'Vehicle updated successfully' }
  } catch (error) {
    console.error('[UPDATE_VEHICLE]', error)
    return to(error)
  }
}

export async function deleteVehicle(id: string): Promise<Result<Vehicle>> {
  try {
    const user = await getCurrentUser()
    if (!user || !isAdmin(user.role)) return { ok: false, message: 'Unauthorized' }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { archivedAt: new Date() },
    })

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    return { ok: true, data: vehicle, message: 'Vehicle removed' }
  } catch (error) {
    console.error('[DELETE_VEHICLE]', error)
    return to(error)
  }
}
