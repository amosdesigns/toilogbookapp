'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

/**
 * Get all locations (active and inactive)
 * Optional filter by active status
 */
export async function getLocations(activeOnly: boolean = false) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const where = activeOnly ? { isActive: true } : {}

    const locations = await prisma.location.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    })

    return {
      success: true,
      locations
    }
  } catch (error) {
    console.error('[GET_LOCATIONS_ACTION]', error)
    return {
      success: false,
      error: 'Failed to fetch locations'
    }
  }
}

/**
 * Get a specific location by ID
 */
export async function getLocation(locationId: string) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: {
        _count: {
          select: {
            logs: true,
            shifts: true,
            dutySessions: true,
          },
        },
      },
    })

    if (!location) {
      return { success: false, error: 'Location not found' }
    }

    return {
      success: true,
      location
    }
  } catch (error) {
    console.error('[GET_LOCATION_ACTION]', error)
    return {
      success: false,
      error: 'Failed to fetch location'
    }
  }
}
