import { z } from 'zod'

export const createSafetyChecklistItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(200, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional().nullable(),
  order: z.number().int().min(0, 'Order must be non-negative').optional(),
  isActive: z.boolean().optional(),
})

export const updateSafetyChecklistItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

export const reorderSafetyChecklistItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(0),
    })
  ),
})

<<<<<<< Updated upstream
export const createMultipleSafetyChecklistItemsSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1, 'Item name is required').max(200, 'Name too long'),
        description: z.string().max(500, 'Description too long').optional().nullable(),
        order: z.number().int().min(0, 'Order must be non-negative').default(0),
        isActive: z.boolean().default(true),
      })
    )
    .min(1, 'At least one item is required'),
})

// Fix type inference for default values in Zod v4
export type CreateSafetyChecklistItemInput = Omit<
  z.infer<typeof createSafetyChecklistItemSchema>,
  'order' | 'isActive'
> & {
  order: number
  isActive: boolean
}
=======
// Type inference
export type CreateSafetyChecklistItemInput = z.infer<typeof createSafetyChecklistItemSchema>
>>>>>>> Stashed changes
export type UpdateSafetyChecklistItemInput = z.infer<typeof updateSafetyChecklistItemSchema>
export type ReorderSafetyChecklistItemsInput = z.infer<typeof reorderSafetyChecklistItemsSchema>
export type CreateMultipleSafetyChecklistItemsInput = {
  items: Array<{
    name: string
    description?: string | null
    order: number
    isActive: boolean
  }>
}
