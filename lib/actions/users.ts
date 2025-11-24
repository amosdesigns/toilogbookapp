'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/sync-user'
import { to, type Result } from '@/lib/utils/RenderError'
import { updateProfileSchema } from '@/lib/validations/user'

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

export async function getUserById(userId: string): Promise<Result<any>> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { ok: false, message: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        phone: true,
        streetAddress: true,
        city: true,
        state: true,
        zipCode: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return { ok: false, message: 'User not found' }
    }

    return { ok: true, data: user }
  } catch (error) {
    console.error('Error fetching user:', error)
    return to(error)
  }
}

export async function updateUserProfile(
  userId: string,
  data: any
): Promise<Result<any>> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Users can only update their own profile
    if (currentUser.id !== userId) {
      return { ok: false, message: 'You can only update your own profile' }
    }

    // Validate input
    const validation = updateProfileSchema.safeParse(data)
    if (!validation.success) {
      return {
        ok: false,
        message: 'Invalid data',
        meta: { errors: validation.error.flatten() },
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validation.data,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        phone: true,
        streetAddress: true,
        city: true,
        state: true,
        zipCode: true,
        role: true,
      },
    })

    revalidatePath('/profile')
    revalidatePath(`/profile/edit/${userId}`)

    return { ok: true, data: updatedUser, message: 'Profile updated successfully' }
  } catch (error) {
    console.error('Error updating profile:', error)
    return to(error)
  }
}
