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
// WRONG - Using any
function processUser(user: any) {
  return user.name
}

// WRONG - Implicit any
const users = data.map(item => item) // item is implicitly any

// WRONG - any in server actions
export async function getUser(): Promise<any> {
  // ...
}

// WRONG - Type assertion to any
const result = apiResponse as any
```

### ✅ ALWAYS Do This

```typescript
// CORRECT - Proper interface
interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

function processUser(user: User): string {
  return user.name
}

// CORRECT - Explicit typing
const users = data.map((item: RawUser): User => ({
  id: item.id,
  name: item.name,
  email: item.email,
  role: item.role
}))

// CORRECT - Proper return type
export async function getUser(): Promise<Result<User>> {
  // ...
}

// CORRECT - Proper type assertion
interface ApiResponse {
  data: User[]
}
const result = apiResponse as ApiResponse
```

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

When Zod v4's type inference doesn't match your needs (e.g., `z.preprocess` returns `unknown`):

### Problem
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
