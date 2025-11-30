'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/sync-user'
import { revalidatePath } from 'next/cache'
import { to, type Result } from '@/lib/utils/RenderError'
import {
  createSafetyChecklistItemSchema,
  updateSafetyChecklistItemSchema,
  reorderSafetyChecklistItemsSchema,
  createMultipleSafetyChecklistItemsSchema,
  type CreateSafetyChecklistItemInput,
  type UpdateSafetyChecklistItemInput,
  type ReorderSafetyChecklistItemsInput,
  type CreateMultipleSafetyChecklistItemsInput,
} from '@/lib/validations/safety-checklist'
import { isAdmin } from '@/lib/utils/auth'

export interface SafetyChecklistItem {
  id: string
  name: string
  description: string | null
  order: number
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
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

// ============================================================================
// ADMIN MANAGEMENT ACTIONS
// ============================================================================

/**
 * Get all safety checklist items (including inactive) - Admin only
 */
export async function getAllSafetyChecklistItems(): Promise<Result<SafetyChecklistItem[]>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!isAdmin(user.role)) {
      return { ok: false, message: 'Admin access required' }
    }

    const items = await prisma.safetyChecklistItem.findMany({
      orderBy: {
        order: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        order: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return {
      ok: true,
      data: items,
    }
  } catch (error) {
    console.error('Error fetching all safety checklist items:', error)
    return to(error)
  }
}

/**
 * Create a new safety checklist item - Admin only
 */
export async function createSafetyChecklistItem(
  input: CreateSafetyChecklistItemInput
): Promise<Result<SafetyChecklistItem>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!isAdmin(user.role)) {
      return { ok: false, message: 'Admin access required' }
    }

    // Validate input
    const validation = createSafetyChecklistItemSchema.safeParse(input)
    if (!validation.success) {
      return {
        ok: false,
        message: 'Invalid input',
        meta: { errors: validation.error.flatten() },
      }
    }

    // Check for duplicate name
    const existing = await prisma.safetyChecklistItem.findFirst({
      where: { name: validation.data.name },
    })

    if (existing) {
      return { ok: false, message: 'A checklist item with this name already exists' }
    }

    // If no order specified, put at end
    let order = validation.data.order
    if (order === 0) {
      const maxOrder = await prisma.safetyChecklistItem.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      order = maxOrder ? maxOrder.order + 1 : 0
    }

    const item = await prisma.safetyChecklistItem.create({
      data: {
        name: validation.data.name,
        description: validation.data.description || null,
        order,
        isActive: validation.data.isActive,
      },
      select: {
        id: true,
        name: true,
        description: true,
        order: true,
      },
    })

    revalidatePath('/admin/dashboard/settings')
    revalidatePath('/')

    return {
      ok: true,
      data: item,
      message: 'Checklist item created successfully',
    }
  } catch (error) {
    console.error('Error creating safety checklist item:', error)
    return to(error)
  }
}

/**
 * Create multiple safety checklist items in batch - Admin only
 * Uses a single transaction for better performance
 */
export async function createMultipleSafetyChecklistItems(
  input: CreateMultipleSafetyChecklistItemsInput
): Promise<Result<{ created: number; skipped: string[] }>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!isAdmin(user.role)) {
      return { ok: false, message: 'Admin access required' }
    }

    // Validate input
    const validation = createMultipleSafetyChecklistItemsSchema.safeParse(input)
    if (!validation.success) {
      return {
        ok: false,
        message: 'Invalid input',
        meta: { errors: validation.error.flatten() },
      }
    }

    const itemsToCreate = validation.data.items

    // Check for duplicates in a single query
    const existingItems = await prisma.safetyChecklistItem.findMany({
      where: {
        name: { in: itemsToCreate.map((item) => item.name) },
      },
      select: { name: true },
    })

    const existingNames = new Set(existingItems.map((item: { name: string }) => item.name.toLowerCase()))
    const skipped: string[] = []
    const uniqueItems = itemsToCreate.filter((item) => {
      if (existingNames.has(item.name.toLowerCase())) {
        skipped.push(item.name)
        return false
      }
      return true
    })

    if (uniqueItems.length === 0) {
      return {
        ok: false,
        message: 'All items already exist',
        meta: { skipped },
      }
    }

    // Get max order for new items
    const maxOrderItem = await prisma.safetyChecklistItem.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    let nextOrder = maxOrderItem ? maxOrderItem.order + 1 : 0

    // Assign orders to items that have order 0 (default)
    const itemsWithOrders = uniqueItems.map((item) => ({
      name: item.name,
      description: item.description || null,
      order: item.order === 0 ? nextOrder++ : item.order,
      isActive: item.isActive ?? true,
    }))

    // Create all items in a single transaction using createMany
    await prisma.safetyChecklistItem.createMany({
      data: itemsWithOrders,
    })

    revalidatePath('/admin/dashboard/settings')
    revalidatePath('/')

    return {
      ok: true,
      data: { created: uniqueItems.length, skipped },
      message:
        skipped.length > 0
          ? `Created ${uniqueItems.length} items, ${skipped.length} skipped (already exist)`
          : `Successfully created ${uniqueItems.length} checklist items`,
    }
  } catch (error) {
    console.error('Error creating multiple safety checklist items:', error)
    return to(error)
  }
}

/**
 * Update a safety checklist item - Admin only
 */
export async function updateSafetyChecklistItem(
  id: string,
  input: UpdateSafetyChecklistItemInput
): Promise<Result<SafetyChecklistItem>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!isAdmin(user.role)) {
      return { ok: false, message: 'Admin access required' }
    }

    // Validate input
    const validation = updateSafetyChecklistItemSchema.safeParse(input)
    if (!validation.success) {
      return {
        ok: false,
        message: 'Invalid input',
        meta: { errors: validation.error.flatten() },
      }
    }

    // Check item exists
    const existing = await prisma.safetyChecklistItem.findUnique({
      where: { id },
    })

    if (!existing) {
      return { ok: false, message: 'Checklist item not found' }
    }

    // Check for duplicate name if name is being updated
    if (validation.data.name && validation.data.name !== existing.name) {
      const duplicate = await prisma.safetyChecklistItem.findFirst({
        where: { name: validation.data.name, id: { not: id } },
      })

      if (duplicate) {
        return { ok: false, message: 'A checklist item with this name already exists' }
      }
    }

    const item = await prisma.safetyChecklistItem.update({
      where: { id },
      data: validation.data,
      select: {
        id: true,
        name: true,
        description: true,
        order: true,
      },
    })

    revalidatePath('/admin/dashboard/settings')
    revalidatePath('/')

    return {
      ok: true,
      data: item,
      message: 'Checklist item updated successfully',
    }
  } catch (error) {
    console.error('Error updating safety checklist item:', error)
    return to(error)
  }
}

/**
 * Delete (soft delete) a safety checklist item - Admin only
 */
export async function deleteSafetyChecklistItem(id: string): Promise<Result<void>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!isAdmin(user.role)) {
      return { ok: false, message: 'Admin access required' }
    }

    // Check item exists
    const existing = await prisma.safetyChecklistItem.findUnique({
      where: { id },
    })

    if (!existing) {
      return { ok: false, message: 'Checklist item not found' }
    }

    // Soft delete by setting isActive to false
    await prisma.safetyChecklistItem.update({
      where: { id },
      data: { isActive: false },
    })

    revalidatePath('/admin/dashboard/settings')
    revalidatePath('/')

    return {
      ok: true,
      data: undefined,
      message: 'Checklist item deleted successfully',
    }
  } catch (error) {
    console.error('Error deleting safety checklist item:', error)
    return to(error)
  }
}

/**
 * Reorder safety checklist items - Admin only
 */
export async function reorderSafetyChecklistItems(
  input: ReorderSafetyChecklistItemsInput
): Promise<Result<void>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, message: 'Unauthorized' }
    }

    if (!isAdmin(user.role)) {
      return { ok: false, message: 'Admin access required' }
    }

    // Validate input
    const validation = reorderSafetyChecklistItemsSchema.safeParse(input)
    if (!validation.success) {
      return {
        ok: false,
        message: 'Invalid input',
        meta: { errors: validation.error.flatten() },
      }
    }

    // Update all items in a transaction
    await prisma.$transaction(
      validation.data.items.map((item) =>
        prisma.safetyChecklistItem.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    )

    revalidatePath('/admin/dashboard/settings')
    revalidatePath('/')

    return {
      ok: true,
      data: undefined,
      message: 'Items reordered successfully',
    }
  } catch (error) {
    console.error('Error reordering safety checklist items:', error)
    return to(error)
  }
}
