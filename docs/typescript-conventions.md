# TypeScript Conventions & Code Standards

## Core Principle: No `any` Types

**CRITICAL RULE**: This codebase maintains strict TypeScript typing with **ZERO tolerance for `any` types**.

### Why No `any`?

1. **Type Safety**: `any` defeats the entire purpose of TypeScript
2. **IDE Support**: Proper types enable autocomplete and catch errors early
3. **Refactoring**: Strong typing makes refactoring safe and reliable
4. **Documentation**: Types serve as inline documentation
5. **Bug Prevention**: Catch type errors at compile time, not runtime

### ❌ NEVER Do This

```typescript
// WRONG - Using any as parameter type
function processUser(user: any) {
  return user.name // No type safety, no autocomplete
}

// WRONG - Implicit any from missing types
const users = data.map(item => item) // item is implicitly any

// WRONG - any in server action return type
export async function getUser(): Promise<any> {
  const user = await prisma.user.findUnique({ where: { id } })
  return user // Loses all type information
}

// WRONG - Server action with any parameters
export async function updateUser(data: any): Promise<Result<any>> {
  // No validation, no type safety
}

// WRONG - Type assertion to any (bypasses type safety)
const result = apiResponse as any
const tourData = (formData as any).tourId // Dangerous!

// WRONG - Using any in type definitions
interface TourStop {
  id: string
  data: any // Defeats the purpose of TypeScript
}
```

### ✅ ALWAYS Do This

```typescript
// CORRECT - Proper interface with all fields typed
interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

function processUser(user: User): string {
  return user.name // Full type safety and autocomplete
}

// CORRECT - Explicit typing in map operations
const users = data.map((item: RawUser): User => ({
  id: item.id,
  name: item.name,
  email: item.email,
  role: item.role
}))

// CORRECT - Server action with Result<T> return type
export async function getUser(userId: string): Promise<Result<User>> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { ok: false, message: 'User not found' }
    }
    return { ok: true, data: user }
  } catch (error) {
    return to(error)
  }
}

// CORRECT - Server action with proper input and output types
export async function updateUser(
  userId: string,
  data: UpdateUserInput
): Promise<Result<User>> {
  // Full type safety throughout
}

// CORRECT - Specific type assertion with interface
interface ApiResponse {
  data: User[]
  meta: { total: number }
}
const result = apiResponse as ApiResponse

// CORRECT - Proper type definition
interface TourStop {
  id: string
  tourId: string
  locationId: string | null
  stopType: TourStopType
  title: string
  observations: string
}
```

### Real-World Examples from This Codebase

These are actual examples of how we eliminated `any` types in this project:

#### Example 1: User Actions (lib/actions/user-actions.ts)

```typescript
// ❌ BEFORE - Using any
export async function getCurrentUser(): Promise<ActionResult<any>> {
  // ...
}

export async function getUsers(): Promise<ActionResult<any>> {
  // ...
}

// ✅ AFTER - Proper interfaces matching Prisma selects
import type { Role } from "@prisma/client"

export interface CurrentUserData {
  id: string
  clerkId: string
  email: string
  firstName: string
  lastName: string
  role: Role
  phone?: string | null
  streetAddress?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UserListItem {
  id: string
  clerkId: string
  email: string
  firstName: string
  lastName: string
  role: Role
  phone?: string | null
  createdAt: Date
}

export async function getCurrentUser(): Promise<ActionResult<CurrentUserData>> {
  // ...
}

export async function getUsers(): Promise<ActionResult<UserListItem[]>> {
  // ...
}
```

#### Example 2: Guards Actions (lib/actions/guards-actions.ts)

```typescript
// ❌ BEFORE - Array of any
export async function getGuardsOnDuty(): Promise<ActionResult<any>> {
  const guards = activeSessions.map((session) => {
    // ... transformation logic
  })
  return { ok: true, data: guards }
}

// ✅ AFTER - Explicit interface for guard data
import type { Role } from "@prisma/client"

export interface GuardOnDutyData {
  userId: string
  userName: string
  userEmail: string
  role: Role
  dutySessionId: string
  locationId: string | null
  locationName: string | null
  clockInTime: Date
  hoursOnDuty: string
}

export async function getGuardsOnDuty(): Promise<ActionResult<GuardOnDutyData[]>> {
  const guards: GuardOnDutyData[] = activeSessions.map((session) => ({
    userId: session.user.id,
    userName: `${session.user.firstName} ${session.user.lastName}`,
    userEmail: session.user.email,
    role: session.user.role,
    dutySessionId: session.id,
    locationId: session.locationId,
    locationName: session.location?.name || null,
    clockInTime: session.clockInTime,
    hoursOnDuty: (/* calculation */).toFixed(1),
  }))
  return { ok: true, data: guards }
}
```

#### Example 3: Incident Actions (lib/actions/incident-actions.ts)

```typescript
// ❌ BEFORE - Using any for complex return type
export async function reviewIncident(
  incidentId: string,
  reviewNotes: string
): Promise<ActionResult<any>> {
  const updatedIncident = await prisma.log.update({
    where: { id: incidentId },
    data: { reviewedBy, reviewedAt, reviewNotes },
    include: {
      user: { select: { firstName: true, lastName: true } },
      location: { select: { name: true } }
    }
  })
  return { ok: true, data: updatedIncident }
}

// ✅ AFTER - Use Prisma.GetPayload for exact typing
import type { Prisma } from "@prisma/client"

export type ReviewedIncident = Prisma.LogGetPayload<{
  include: {
    user: {
      select: {
        firstName: true
        lastName: true
      }
    }
    location: {
      select: {
        name: true
      }
    }
  }
}>

export async function reviewIncident(
  incidentId: string,
  reviewNotes: string
): Promise<ActionResult<ReviewedIncident>> {
  // TypeScript now knows the exact shape of updatedIncident
  const updatedIncident = await prisma.log.update({ /* ... */ })
  return { ok: true, data: updatedIncident }
}
```

### Key Patterns for Eliminating `any`

1. **Create interfaces that match your Prisma select/include queries**
2. **Use `Prisma.ModelGetPayload<{...}>` for complex queries with relations**
3. **Export types from action files for use in components**
4. **Use proper Prisma-generated types (e.g., `Role` from `@prisma/client`)**
5. **Make optional fields explicit with `?: type | null`** to match database nullability

## Result<T> Pattern

All server actions MUST return `Result<T>` type:

```typescript
// Type definition (from lib/utils/RenderError.ts)
export type Result<T> =
  | { ok: true; data: T; message?: string; meta?: Record<string, unknown> }
  | { ok: false; message: string; code?: string; meta?: Record<string, unknown> }

// Usage in server actions
export async function getUser(userId: string): Promise<Result<User>> {
  try {
    // Authenticate
    const { userId: currentUserId } = await auth()
    if (!currentUserId) {
      return { ok: false, message: "Unauthorized" }
    }

    // Database query
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    })

    if (!user) {
      return { ok: false, message: "User not found" }
    }

    // Success
    return { ok: true, data: user }
  } catch (error) {
    console.error("[GET_USER]", error)
    return to(error) // Helper converts error to Result format
  }
}
```

## Handling Zod + React Hook Form Type Conflicts

### Problem 1: `z.coerce.number()` Creates Type Issues

When using `z.coerce.number()`, the inferred type becomes `unknown`, causing TypeScript errors with `zodResolver`:

```typescript
// ❌ PROBLEMATIC - z.coerce creates 'unknown' type
export const schema = z.object({
  mileage: z.coerce.number().int().min(0)
})

type FormData = z.infer<typeof schema> // { mileage: unknown } ❌

const form = useForm<FormData>({
  resolver: zodResolver(schema), // Type error!
  defaultValues: { mileage: 0 }
})
```

**Error**: `Type 'unknown' is not assignable to type 'number'`

### Solution: Use `z.number()` for Number Inputs

Since HTML `<input type="number">` already returns a number via `valueAsNumber`, use `z.number()` instead:

```typescript
// ✅ CORRECT - z.number() for proper type inference
export const schema = z.object({
  mileage: z.number()
    .int('Mileage must be a whole number')
    .min(0, 'Mileage cannot be negative')
    .max(999999, 'Mileage value too large')
})

type FormData = z.infer<typeof schema> // { mileage: number } ✅

const form = useForm<FormData>({
  resolver: zodResolver(schema), // Works perfectly!
  defaultValues: { mileage: 0 }
})

// In the component, use onChange to convert string to number
<Input
  type="number"
  {...field}
  onChange={(e) => field.onChange(e.target.valueAsNumber)}
/>
```

**When to use each**:
- ✅ Use `z.number()` when input is already a number (form inputs with `type="number"`)
- ✅ Use `z.coerce.number()` when parsing string data from external sources (URL params, API responses)

### Problem 2: `z.preprocess()` Returns `unknown`

```typescript
// Zod schema with preprocessing
export const schema = z.object({
  date: z.preprocess((val) => new Date(val as string), z.date())
})

// Inferred type has 'unknown' for date field
type Inferred = z.infer<typeof schema> // { date: unknown }
```

### Solution: Manual Type Override
```typescript
// Override the inferred type
export type MyFormInput = Omit<z.infer<typeof schema>, 'date'> & {
  date: Date
}

// Use in form with explicit Resolver type
import { type Resolver } from "react-hook-form"

const form = useForm<MyFormInput>({
  resolver: zodResolver(schema) as Resolver<MyFormInput>,
  defaultValues: {
    date: new Date(),
  }
})
```

## Type Definitions

### Centralized Types (`lib/types.ts`)

```typescript
// Always use the centralized type definitions
import type { UserRole, Location, DutySession } from "@/lib/types"

// DON'T define types inline
interface User { // ❌ Wrong if User type exists in lib/types.ts
  id: string
  role: string // ❌ Should use UserRole type
}

// DO import from central location
import type { User, UserRole } from "@/lib/types" // ✅ Correct
```

### Component Props

```typescript
// ALWAYS explicitly type component props
interface MyComponentProps {
  user: User
  onUpdate: (data: User) => void
  isLoading?: boolean
}

export function MyComponent({ user, onUpdate, isLoading = false }: MyComponentProps) {
  // ...
}

// NOT like this ❌
export function MyComponent(props: any) { // NEVER use any
  // ...
}
```

### Event Handlers

```typescript
// Explicit event types
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // ...
}

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // ...
}

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  // ...
}

// NOT like this ❌
const handleClick = (e: any) => { // NEVER
  // ...
}
```

## Union Types and Literals

```typescript
// Use union types for specific values
type ViewMode = "weekly" | "monthly"

// NOT like this ❌
const viewMode: string = "weekly" // Too broad

// CORRECT ✅
const viewMode: ViewMode = "weekly"

// Use in function parameters
function setViewMode(mode: ViewMode) {
  // TypeScript will enforce only "weekly" or "monthly"
}
```

## Type Guards

```typescript
// Create type guards for runtime checks
function isOk<T>(result: Result<T>): result is { ok: true; data: T } {
  return result.ok === true
}

// Usage
const result = await getUser(userId)
if (isOk(result)) {
  console.log(result.data.email) // TypeScript knows data exists
} else {
  console.error(result.message) // TypeScript knows data doesn't exist
}
```

## Unknown vs Any

When you MUST handle unknown data:

```typescript
// Use 'unknown' for truly unknown data
function parseJSON(json: string): unknown {
  return JSON.parse(json)
}

// Then validate and narrow the type
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Narrow with type guard or validation
    const validated = mySchema.safeParse(data)
    if (validated.success) {
      // Now you have proper types
      return validated.data
    }
  }
  throw new Error("Invalid data")
}

// NEVER use any ❌
function parseJSON(json: string): any { // WRONG
  return JSON.parse(json)
}
```

## Third-Party Library Types

```typescript
// Install type definitions
// npm install --save-dev @types/package-name

// If types don't exist, create declaration file
// types/package-name.d.ts
declare module 'package-name' {
  export interface SomeType {
    id: string
    name: string
  }

  export function someFunction(param: SomeType): void
}

// Use the types
import { SomeType } from 'package-name'
```

## Prisma Generated Types

```typescript
// Import Prisma generated types
import type { User, Log, Location } from "@prisma/client"

// Use Prisma's utility types
import type { Prisma } from "@prisma/client"

// Select subset of fields
type UserWithRole = Prisma.UserGetPayload<{
  select: {
    id: true
    email: true
    role: true
  }
}>

// Include relations
type UserWithLogs = Prisma.UserGetPayload<{
  include: {
    logs: true
  }
}>
```

## Async Function Returns

```typescript
// ALWAYS type async function returns
async function fetchUser(id: string): Promise<Result<User>> {
  // ...
}

// NOT like this ❌
async function fetchUser(id: string) { // Missing return type
  // ...
}
```

## Type Assertions (Use Sparingly)

```typescript
// ONLY use type assertions when you're certain
const userRole = (user?.publicMetadata?.role as UserRole) || "GUARD"

// Better: Use type guard
function isUserRole(role: unknown): role is UserRole {
  return typeof role === 'string' &&
    ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'GUARD'].includes(role)
}

const role = user?.publicMetadata?.role
const userRole: UserRole = isUserRole(role) ? role : "GUARD"
```

## Checking for `any` Types

### ESLint Rule
```json
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-return": "error"
  }
}
```

### Find `any` in codebase
```bash
# Search for 'any' types in TypeScript files (excluding node_modules)
grep -r ": any" --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" .

# Search for 'as any' type assertions
grep -r "as any" --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" .
```

## Common Patterns

### Server Action Pattern
```typescript
"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { to, type Result } from "@/lib/utils/RenderError"
import { revalidatePath } from "next/cache"
import type { UserRole } from "@/lib/types"

export async function myAction(
  data: MyInputType
): Promise<Result<MyReturnType>> {
  try {
    // 1. Auth check
    const { userId } = await auth()
    if (!userId) {
      return { ok: false, message: "Unauthorized" }
    }

    // 2. Get current user for role check
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })

    if (!currentUser) {
      return { ok: false, message: "User not found" }
    }

    // 3. Permission check
    if (!hasPermission(currentUser.role)) {
      return { ok: false, message: "Insufficient permissions" }
    }

    // 4. Database operation
    const result = await prisma.model.create({
      data: validatedData,
    })

    // 5. Revalidate
    revalidatePath("/path")

    // 6. Return success
    return { ok: true, data: result }
  } catch (error) {
    console.error("[MY_ACTION]", error)
    return to(error)
  }
}
```

### Form Component Pattern
```typescript
"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { mySchema, type MyFormInput } from "@/lib/validations"

interface MyFormProps {
  onSubmit: (data: MyFormInput) => void | Promise<void>
  defaultValues?: Partial<MyFormInput>
  isLoading?: boolean
}

export function MyForm({
  onSubmit,
  defaultValues,
  isLoading = false
}: MyFormProps) {
  const form = useForm<MyFormInput>({
    resolver: zodResolver(mySchema) as Resolver<MyFormInput>,
    defaultValues: {
      // ... properly typed defaults
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* ... */}
      </form>
    </Form>
  )
}
```

## Summary: The Golden Rules

1. ✅ **NO `any` types** - Ever. Period.
2. ✅ **Use `Result<T>`** for all server actions
3. ✅ **Import types** from `@/lib/types`
4. ✅ **Explicit return types** on all functions
5. ✅ **Type component props** with interfaces
6. ✅ **Use `unknown`** instead of `any` for truly unknown data
7. ✅ **Proper type guards** for runtime validation
8. ✅ **Manual type overrides** when Zod inference fails
9. ✅ **Resolver<T> type** for React Hook Form
10. ✅ **Search codebase** regularly for `any` violations

## When You're Tempted to Use `any`

**STOP** and do one of these instead:

1. **Create a proper interface** - Takes 30 seconds
2. **Use `unknown` + type guard** - Safe and explicit
3. **Use Zod validation** - Runtime + compile-time safety
4. **Check Prisma types** - Might already be generated
5. **Ask for help** - Better than breaking type safety

**Remember**: Every `any` is a bug waiting to happen. Keep this codebase 100% type-safe!
