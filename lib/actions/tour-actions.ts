'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/sync-user'
import { to, type ActionResult } from '@/lib/utils/RenderError'
import { startTourSchema, completeTourSchema, createTourStopSchema } from '@/lib/validations/tour'
import type { TourWithStops, TourWithSupervisor, TourWithFullRelations, TourStopWithRelations } from '@/lib/types/prisma-types'
import { TourStatus, Prisma } from '@prisma/client'

// ============================================================================
// Start Tour
// ============================================================================

export async function startTour(data: {
  carNumber: string
  radioNumber: string
  startingMileage: number
  title?: string
}): Promise<ActionResult<TourWithStops>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Verify user is supervisor or higher
    if (user.role !== 'SUPERVISOR' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return { ok: false, message: 'Only supervisors can start tours' }
    }

    // Validate input
    const validation = startTourSchema.safeParse(data)
    if (!validation.success) {
      return {
        ok: false,
        message: 'Invalid data',
        meta: { errors: validation.error.flatten() }
      }
    }

    // Check for incomplete tours
    const incompleteTour = await prisma.tour.findFirst({
      where: {
        supervisorId: user.id,
        status: 'IN_PROGRESS'
      },
      select: { id: true }
    })

    // Create new tour
    const tour = await prisma.tour.create({
      data: {
        supervisorId: user.id,
        carNumber: validation.data.carNumber,
        radioNumber: validation.data.radioNumber,
        startingMileage: validation.data.startingMileage,
        title: validation.data.title,
        status: 'IN_PROGRESS'
      },
      include: {
        tourStops: {
          include: {
            location: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/tours')

    // Return warning if incomplete tour exists
    if (incompleteTour) {
      return {
        ok: true,
        data: tour,
        message: 'Tour started successfully',
        meta: {
          incompleteTourWarning: 'You have an incomplete tour. Please complete it when finished.'
        }
      }
    }

    return { ok: true, data: tour, message: 'Tour started successfully' }
  } catch (error) {
    console.error('[START_TOUR]', error)
    return to(error)
  }
}

// ============================================================================
// Complete Tour
// ============================================================================

export async function completeTour(
  tourId: string,
  data: {
    endingMileage: number
    carReturned: boolean
    radioReturned: boolean
    keysReturned: boolean
    notes?: string
  }
): Promise<ActionResult<TourWithStops>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Validate input
    const validation = completeTourSchema.safeParse(data)
    if (!validation.success) {
      return {
        ok: false,
        message: 'Invalid data',
        meta: { errors: validation.error.flatten() }
      }
    }

    // Check if tour exists and belongs to user
    const existingTour = await prisma.tour.findUnique({
      where: { id: tourId },
      select: { supervisorId: true, status: true, startingMileage: true }
    })

    if (!existingTour) {
      return { ok: false, message: 'Tour not found' }
    }

    if (existingTour.supervisorId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return { ok: false, message: 'You do not have permission to complete this tour' }
    }

    if (existingTour.status !== 'IN_PROGRESS') {
      return { ok: false, message: 'Tour is not in progress' }
    }

    // Validate ending mileage >= starting mileage
    if (validation.data.endingMileage < existingTour.startingMileage) {
      return {
        ok: false,
        message: 'Ending mileage must be greater than or equal to starting mileage'
      }
    }

    // Update tour
    const tour = await prisma.tour.update({
      where: { id: tourId },
      data: {
        endingMileage: validation.data.endingMileage,
        carReturned: validation.data.carReturned,
        radioReturned: validation.data.radioReturned,
        keysReturned: validation.data.keysReturned,
        notes: validation.data.notes,
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: {
        tourStops: {
          include: {
            location: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/tours')
    revalidatePath(`/admin/tours/${tourId}`)

    return { ok: true, data: tour, message: 'Tour completed successfully' }
  } catch (error) {
    console.error('[COMPLETE_TOUR]', error)
    return to(error)
  }
}

// ============================================================================
// Create Tour Stop
// ============================================================================

export async function createTourStop(data: {
  tourId: string
  locationId?: string
  stopType: string
  title: string
  observations: string
  photoUrls?: string[]
  guardUserId?: string
  guardPerformanceNotes?: string
  issuesSeverity?: string
  followUpRequired?: boolean
}): Promise<ActionResult<TourStopWithRelations>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Validate input
    const validation = createTourStopSchema.safeParse(data)
    if (!validation.success) {
      return {
        ok: false,
        message: 'Invalid data',
        meta: { errors: validation.error.flatten() }
      }
    }

    // Check if tour exists and belongs to user
    const tour = await prisma.tour.findUnique({
      where: { id: validation.data.tourId },
      select: { supervisorId: true, status: true }
    })

    if (!tour) {
      return { ok: false, message: 'Tour not found' }
    }

    if (tour.supervisorId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return { ok: false, message: 'You do not have permission to add stops to this tour' }
    }

    if (tour.status !== 'IN_PROGRESS') {
      return { ok: false, message: 'Cannot add stops to completed tour' }
    }

    // Create tour stop
    const tourStop = await prisma.tourStop.create({
      data: {
        tourId: validation.data.tourId,
        locationId: validation.data.locationId,
        stopType: validation.data.stopType as any,
        title: validation.data.title,
        observations: validation.data.observations,
        photoUrls: validation.data.photoUrls ? JSON.stringify(validation.data.photoUrls) : null,
        guardUserId: validation.data.guardUserId,
        guardPerformanceNotes: validation.data.guardPerformanceNotes,
        issuesSeverity: validation.data.issuesSeverity,
        followUpRequired: validation.data.followUpRequired
      },
      include: {
        location: {
          select: {
            id: true,
            name: true
          }
        },
        guardUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    })

    revalidatePath(`/admin/tours/${validation.data.tourId}`)

    return { ok: true, data: tourStop, message: 'Tour stop created successfully' }
  } catch (error) {
    console.error('[CREATE_TOUR_STOP]', error)
    return to(error)
  }
}

// ============================================================================
// Complete Tour Stop
// ============================================================================

export async function completeTourStop(stopId: string): Promise<ActionResult<TourStopWithRelations>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Check if stop exists
    const existingStop = await prisma.tourStop.findUnique({
      where: { id: stopId },
      select: {
        tour: {
          select: { supervisorId: true }
        }
      }
    })

    if (!existingStop) {
      return { ok: false, message: 'Tour stop not found' }
    }

    if (existingStop.tour.supervisorId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return { ok: false, message: 'You do not have permission to update this tour stop' }
    }

    // Update stop with departed time
    const tourStop = await prisma.tourStop.update({
      where: { id: stopId },
      data: { departedAt: new Date() },
      include: {
        location: {
          select: {
            id: true,
            name: true
          }
        },
        guardUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    })

    return { ok: true, data: tourStop, message: 'Tour stop completed' }
  } catch (error) {
    console.error('[COMPLETE_TOUR_STOP]', error)
    return to(error)
  }
}

// ============================================================================
// Get Tours
// ============================================================================

export async function getTours(params?: {
  supervisorId?: string
  status?: string
  startDate?: string
  endDate?: string
}): Promise<ActionResult<TourWithSupervisor[]>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Build where clause
    const where: Prisma.TourWhereInput = {}

    // Non-admins can only see their own tours
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      where.supervisorId = user.id
    } else if (params?.supervisorId) {
      // Admins can filter by supervisor
      where.supervisorId = params.supervisorId
    }

    // Status filter
    if (params?.status) {
      where.status = params.status as TourStatus
    }

    // Date filters
    if (params?.startDate || params?.endDate) {
      where.startedAt = {}
      if (params.startDate) {
        where.startedAt.gte = new Date(params.startDate)
      }
      if (params.endDate) {
        where.startedAt.lte = new Date(params.endDate)
      }
    }

    const tours = await prisma.tour.findMany({
      where,
      include: {
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        tourStops: {
          include: {
            location: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { startedAt: 'desc' }
    })

    return { ok: true, data: tours }
  } catch (error) {
    console.error('[GET_TOURS]', error)
    return to(error)
  }
}

// ============================================================================
// Get Tour By ID
// ============================================================================

export async function getTourById(tourId: string): Promise<ActionResult<TourWithFullRelations>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        tourStops: {
          include: {
            location: {
              select: {
                id: true,
                name: true
              }
            },
            guardUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          },
          orderBy: { arrivedAt: 'asc' }
        }
      }
    })

    if (!tour) {
      return { ok: false, message: 'Tour not found' }
    }

    // Verify access
    if (tour.supervisorId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return { ok: false, message: 'You do not have permission to view this tour' }
    }

    return { ok: true, data: tour }
  } catch (error) {
    console.error('[GET_TOUR_BY_ID]', error)
    return to(error)
  }
}

// ============================================================================
// Cancel Tour
// ============================================================================

export async function cancelTour(tourId: string, reason?: string): Promise<ActionResult<null>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Check if tour exists and belongs to user
    const existingTour = await prisma.tour.findUnique({
      where: { id: tourId },
      select: { supervisorId: true, status: true }
    })

    if (!existingTour) {
      return { ok: false, message: 'Tour not found' }
    }

    if (existingTour.supervisorId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return { ok: false, message: 'You do not have permission to cancel this tour' }
    }

    if (existingTour.status !== 'IN_PROGRESS') {
      return { ok: false, message: 'Only in-progress tours can be cancelled' }
    }

    // Update tour status to cancelled
    await prisma.tour.update({
      where: { id: tourId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
        notes: reason
      }
    })

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/tours')
    revalidatePath(`/admin/tours/${tourId}`)

    return { ok: true, data: null, message: 'Tour cancelled successfully' }
  } catch (error) {
    console.error('[CANCEL_TOUR]', error)
    return to(error)
  }
}
