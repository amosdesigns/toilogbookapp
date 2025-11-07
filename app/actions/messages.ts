'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const sendMessageSchema = z.object({
  recipientId: z.string().cuid(),
  message: z.string().min(1, 'Message cannot be empty'),
})

/**
 * Send a message to a guard (supervisor feature)
 * Currently a placeholder - requires Message database table
 */
export async function sendMessage(data: z.infer<typeof sendMessageSchema>) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const validatedData = sendMessageSchema.parse(data)

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!currentUser) {
      return { success: false, error: 'User not found' }
    }

    // Only supervisors and above can send messages
    if (!['SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return {
        success: false,
        error: 'Only supervisors and above can send messages'
      }
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: validatedData.recipientId },
    })

    if (!recipient) {
      return { success: false, error: 'Recipient not found' }
    }

    // TODO: Implement Message model in Prisma schema and create message
    // For now, return success as placeholder
    //
    // await prisma.message.create({
    //   data: {
    //     senderId: currentUser.id,
    //     recipientId: validatedData.recipientId,
    //     content: validatedData.message,
    //     read: false,
    //   },
    // })

    console.log('[SEND_MESSAGE_ACTION] Placeholder - Message would be sent:', {
      from: `${currentUser.firstName} ${currentUser.lastName}`,
      to: `${recipient.firstName} ${recipient.lastName}`,
      message: validatedData.message,
    })

    return {
      success: true,
      message: 'Message sent successfully (placeholder)'
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        issues: error.issues
      }
    }

    console.error('[SEND_MESSAGE_ACTION]', error)
    return {
      success: false,
      error: 'Failed to send message'
    }
  }
}

/**
 * Get messages for the current user
 * Currently a placeholder - requires Message database table
 */
export async function getMessages() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // TODO: Implement with Message model
    // const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    // const messages = await prisma.message.findMany({ where: { recipientId: user.id } })

    return {
      success: true,
      messages: [] // Placeholder
    }
  } catch (error) {
    console.error('[GET_MESSAGES_ACTION]', error)
    return {
      success: false,
      error: 'Failed to fetch messages'
    }
  }
}
