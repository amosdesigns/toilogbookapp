import { z } from 'zod'

export const RoleEnum = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'SUPERVISOR',
  'GUARD',
])

export const createUserSchema = z.object({
  clerkId: z.string().min(1, 'Clerk ID is required'),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: RoleEnum.default('GUARD'),
})

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional().nullable(),
  lastName: z.string().min(1).max(100).optional().nullable(),
  role: RoleEnum.optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type Role = z.infer<typeof RoleEnum>
