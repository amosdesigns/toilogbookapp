'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/sync-user'
import { revalidatePath } from 'next/cache'
import { to, type Result } from '@/lib/utils/RenderError'

export interface SafetyChecklistItem {
  id: string
  name: string
  description: string | null
  order: number
}

export interface ChecklistItemData {
  itemId: string
  checked: boolean
  notes?: string
}

export interface SubmitChecklistData {
  dutySessionId: string
  locationId: string
  items: ChecklistItemData[]
}

/**
 * Get all active safety checklist items ordered by display order
 */
export async function getSafetyChecklistItems(): Promise<Result<SafetyChecklistItem[]>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    const items = await prisma.safetyChecklistItem.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        order: true,
      },
    })

    return {
      ok: true,
      data: items,
    }
  } catch (error) {
    console.error('Error fetching safety checklist items:', error)
    return to(error)
  }
}

/**
 * Submit a completed safety checklist
 * Creates checklist response, individual item checks, and auto-generates log entry
 */
export async function submitSafetyChecklist(
  data: SubmitChecklistData
): Promise<Result<{ responseId: string; logId: string }>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    // Validate that duty session exists and belongs to user
    const dutySession = await prisma.dutySession.findUnique({
      where: { id: data.dutySessionId },
      include: { location: true },
    })

    if (!dutySession) {
      return { ok: false, message: 'Duty session not found' }
    }

    if (dutySession.userId !== user.id) {
      return { ok: false, message: 'You can only submit checklists for your own duty sessions' }
    }

    if (dutySession.clockOutTime !== null) {
      return { ok: false, message: 'Cannot submit checklist for completed duty session' }
    }

    // Verify location
    const location = await prisma.location.findUnique({
      where: { id: data.locationId },
    })

    if (!location) {
      return { ok: false, message: 'Location not found' }
    }

    // Create checklist response and log entry in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the safety checklist response
      const checklistResponse = await tx.safetyChecklistResponse.create({
        data: {
          dutySessionId: data.dutySessionId,
          userId: user.id,
          locationId: data.locationId,
          completedAt: new Date(),
        },
      })

      // 2. Create individual item checks
      await tx.safetyChecklistItemCheck.createMany({
        data: data.items.map((item) => ({
          safetyChecklistResponseId: checklistResponse.id,
          safetyChecklistItemId: item.itemId,
          checked: item.checked,
          notes: item.notes || null,
        })),
      })

      // 3. Generate description for log entry
      const itemsChecked = data.items.filter((item) => item.checked).length
      const totalItems = data.items.length
      const itemsWithNotes = data.items.filter((item) => item.notes && item.notes.trim() !== '')

      let description = `Safety equipment checklist completed. ${itemsChecked}/${totalItems} items checked.`

      if (itemsWithNotes.length > 0) {
        description += '\n\nNotes:\n'
        for (const item of itemsWithNotes) {
          const itemData = await tx.safetyChecklistItem.findUnique({
            where: { id: item.itemId },
            select: { name: true },
          })
          if (itemData && item.notes) {
            description += `- ${itemData.name}: ${item.notes}\n`
          }
        }
      }

      // 4. Auto-create log entry
      const log = await tx.log.create({
        data: {
          type: 'ON_DUTY_CHECKLIST',
          title: 'On-Duty Safety Checklist',
          description,
          status: 'LIVE',
          locationId: data.locationId,
          userId: user.id,
          shiftId: dutySession.shiftId,
        },
      })

      // 5. Link log to checklist response
      await tx.safetyChecklistResponse.update({
        where: { id: checklistResponse.id },
        data: { logId: log.id },
      })

      return {
        responseId: checklistResponse.id,
        logId: log.id,
      }
    })

    // Revalidate relevant paths
    revalidatePath('/')
    revalidatePath('/logs')

    return {
      ok: true,
      data: result,
      message: 'Safety checklist submitted successfully',
    }
  } catch (error) {
    console.error('Error submitting safety checklist:', error)
    return to(error)
  }
}
