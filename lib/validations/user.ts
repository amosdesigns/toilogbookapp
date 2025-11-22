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

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  phone: z.string().optional().nullable(),
  streetAddress: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().max(2, 'State must be 2 characters').optional().nullable(),
  zipCode: z.string().max(10, 'Invalid ZIP code').optional().nullable(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type Role = z.infer<typeof RoleEnum>
