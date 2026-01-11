# API Integration Quick Start Guide
## React Native Mobile App Backend Integration

This document provides code examples and patterns for creating the API layer that bridges the React Native mobile app with the existing Next.js backend.

---

## Table of Contents

1. [Authentication Middleware](#authentication-middleware)
2. [API Route Examples](#api-route-examples)
3. [Type Definitions](#type-definitions)
4. [React Native Client Library](#react-native-client-library)
5. [React Query Hooks](#react-query-hooks)

---

## Authentication Middleware

### 1. Create Auth Middleware Utility

**File:** `lib/api/auth-middleware.ts`

```typescript
"use server"

import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Result } from '@/lib/utils/RenderError'
import type { User } from '@prisma/client'

/**
 * Validates Clerk token from Authorization header
 * Returns userId if valid, error if not
 */
export async function validateClerkToken(
  req: NextRequest
): Promise<Result<{ userId: string }>> {
  try {
    // Get Clerk session from request
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: 'Unauthorized - No valid session' }
    }

    return { ok: true, data: { userId } }
  } catch (error) {
    console.error('[AUTH_MIDDLEWARE] Token validation error:', error)
    return { ok: false, message: 'Invalid authentication token' }
  }
}

/**
 * Gets user from database by Clerk ID
 * Syncs user if not found
 */
export async function getUserFromClerkId(
  clerkUserId: string
): Promise<Result<User>> {
  try {
    // First, try to find user by Clerk ID
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    })

    // If not found, try to sync (handles new users)
    if (!user) {
      console.log('[AUTH_MIDDLEWARE] User not found, attempting sync...')
      // Import sync function
      const { syncUserToDatabase } = await import('@/lib/auth/sync-user')
      const syncResult = await syncUserToDatabase()

      if (!syncResult.success || !syncResult.user) {
        return { ok: false, message: 'Failed to sync user' }
      }

      user = syncResult.user
    }

    return { ok: true, data: user }
  } catch (error) {
    console.error('[AUTH_MIDDLEWARE] Error fetching user:', error)
    return { ok: false, message: 'Failed to fetch user' }
  }
}

/**
 * Combined auth check - validates token and gets user
 * Use this in all API routes
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<Result<User>> {
  const tokenResult = await validateClerkToken(req)

  if (!tokenResult.ok) {
    return tokenResult
  }

  return await getUserFromClerkId(tokenResult.data.userId)
}
```

---

## API Route Examples

### 2. Duty Management API Routes

#### Clock In

**File:** `app/api/mobile/duty/clock-in/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api/auth-middleware'
import { clockIn } from '@/lib/actions/duty-session-actions'
import { z } from 'zod'

const clockInSchema = z.object({
  locationId: z.string().cuid(),
  shiftId: z.string().cuid().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const authResult = await authenticateRequest(req)
    if (!authResult.ok) {
      return NextResponse.json(authResult, { status: 401 })
    }

    // 2. Parse and validate body
    const body = await req.json()
    const validation = clockInSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Invalid request data',
          meta: { errors: validation.error.flatten() }
        },
        { status: 400 }
      )
    }

    // 3. Call server action
    // Note: clockIn() internally calls getCurrentUser() to get the authenticated user
    const result = await clockIn(validation.data)

    // 4. Return result
    return NextResponse.json(result, {
      status: result.ok ? 200 : 400
    })
  } catch (error) {
    console.error('[API] Clock in error:', error)
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### Clock Out

**File:** `app/api/mobile/duty/clock-out/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api/auth-middleware'
import { clockOut } from '@/lib/actions/duty-session-actions'
import { z } from 'zod'

const clockOutSchema = z.object({
  dutySessionId: z.string().cuid(),
})

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req)
    if (!authResult.ok) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const body = await req.json()
    const validation = clockOutSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Invalid request data',
          meta: { errors: validation.error.flatten() }
        },
        { status: 400 }
      )
    }

    const result = await clockOut(validation.data.dutySessionId)

    return NextResponse.json(result, {
      status: result.ok ? 200 : 400
    })
  } catch (error) {
    console.error('[API] Clock out error:', error)
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### Get Active Duty Session

**File:** `app/api/mobile/duty/active/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api/auth-middleware'
import { getActiveDutySession } from '@/lib/actions/duty-session-actions'

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req)
    if (!authResult.ok) {
      return NextResponse.json(authResult, { status: 401 })
    }

    // getActiveDutySession() uses getCurrentUser() internally
    const result = await getActiveDutySession()

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Get active duty error:', error)
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 3. Logs API Routes

#### Query Logs (GET) and Create Log (POST)

**File:** `app/api/mobile/logs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api/auth-middleware'
import { getLogs, createLog } from '@/lib/actions/logs'
import { createLogSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req)
    if (!authResult.ok) {
      return NextResponse.json(authResult, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(req.url)
    const params = {
      locationId: searchParams.get('locationId') || undefined,
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
      skip: parseInt(searchParams.get('skip') || '0'),
      take: parseInt(searchParams.get('take') || '10'),
    }

    const result = await getLogs(params)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Get logs error:', error)
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req)
    if (!authResult.ok) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const body = await req.json()
    const validation = createLogSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Invalid request data',
          meta: { errors: validation.error.flatten() }
        },
        { status: 400 }
      )
    }

    const result = await createLog(validation.data)

    return NextResponse.json(result, {
      status: result.ok ? 201 : 400
    })
  } catch (error) {
    console.error('[API] Create log error:', error)
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### Get, Update, Delete Single Log

**File:** `app/api/mobile/logs/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api/auth-middleware'
import { getLogById, updateLog, deleteLog } from '@/lib/actions/logs'
import { updateLogSchema } from '@/lib/validations'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(req)
    if (!authResult.ok) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const result = await getLogById(params.id)

    return NextResponse.json(result, {
      status: result.ok ? 200 : 404
    })
  } catch (error) {
    console.error('[API] Get log error:', error)
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(req)
    if (!authResult.ok) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const body = await req.json()
    const validation = updateLogSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Invalid request data',
          meta: { errors: validation.error.flatten() }
        },
        { status: 400 }
      )
    }

    const result = await updateLog(params.id, validation.data)

    return NextResponse.json(result, {
      status: result.ok ? 200 : 400
    })
  } catch (error) {
    console.error('[API] Update log error:', error)
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(req)
    if (!authResult.ok) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const result = await deleteLog(params.id)

    return NextResponse.json(result, {
      status: result.ok ? 200 : 400
    })
  } catch (error) {
    console.error('[API] Delete log error:', error)
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 4. Locations API Route

**File:** `app/api/mobile/locations/active/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api/auth-middleware'
import { getActiveLocations } from '@/lib/actions/location-actions'

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req)
    if (!authResult.ok) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const result = await getActiveLocations()

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Get locations error:', error)
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 5. Safety Checklist API Routes

#### Get Checklist Items

**File:** `app/api/mobile/safety/items/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api/auth-middleware'
import { getSafetyChecklistItems } from '@/lib/actions/safety-checklist-actions'

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req)
    if (!authResult.ok) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const result = await getSafetyChecklistItems()

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Get safety items error:', error)
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### Submit Checklist

**File:** `app/api/mobile/safety/submit/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api/auth-middleware'
import { submitSafetyChecklist } from '@/lib/actions/safety-checklist-actions'
import { z } from 'zod'

const submitChecklistSchema = z.object({
  dutySessionId: z.string().cuid(),
  items: z.array(
    z.object({
      itemId: z.string().cuid(),
      checked: z.boolean(),
      notes: z.string().optional(),
    })
  ),
})

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req)
    if (!authResult.ok) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const body = await req.json()
    const validation = submitChecklistSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Invalid request data',
          meta: { errors: validation.error.flatten() }
        },
        { status: 400 }
      )
    }

    const result = await submitSafetyChecklist(validation.data)

    return NextResponse.json(result, {
      status: result.ok ? 201 : 400
    })
  } catch (error) {
    console.error('[API] Submit checklist error:', error)
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Type Definitions

### Shared Types for React Native

Create these types in your React Native app. They should match the Prisma types exactly.

**File (RN App):** `lib/types/index.ts`

```typescript
// User & Auth
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'GUARD'

export interface User {
  id: string
  clerkId: string
  email: string
  firstName: string | null
  lastName: string | null
  username: string | null
  phoneNumber: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  role: Role
  createdAt: Date
  updatedAt: Date
}

// Duty Management
export interface DutySession {
  id: string
  userId: string
  locationId: string | null
  clockInTime: Date
  clockOutTime: Date | null
  shiftId: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  // Relations
  location?: Location | null
  shift?: Shift | null
  user?: User
}

// Locations
export interface Location {
  id: string
  name: string
  address: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Logs
export type LogType =
  | 'INCIDENT'
  | 'PATROL'
  | 'VISITOR_CHECKIN'
  | 'MAINTENANCE'
  | 'WEATHER'
  | 'OTHER'
  | 'ON_DUTY_CHECKLIST'

export type RecordStatus = 'LIVE' | 'UPDATED' | 'ARCHIVED' | 'DRAFT'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Log {
  id: string
  type: LogType
  title: string
  description: string
  status: RecordStatus
  severity: Severity | null
  locationId: string
  userId: string
  shiftId: string | null
  incidentTime: Date | null
  peopleInvolved: string | null
  witnesses: string | null
  actionsTaken: string | null
  followUpRequired: boolean
  reviewedBy: string | null
  reviewedAt: Date | null
  reviewNotes: string | null
  createdAt: Date
  updatedAt: Date
  archivedAt: Date | null
  // Relations
  location: Location
  user: User
  shift?: Shift | null
  reviewer?: User | null
}

// Shifts
export interface Shift {
  id: string
  name: string
  startTime: Date
  endTime: Date
  locationId: string
  supervisorId: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  archivedAt: Date | null
  // Relations
  location: Location
  supervisor?: User | null
  guards?: User[]
}

// Safety Checklist
export interface SafetyChecklistItem {
  id: string
  name: string
  description: string | null
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Messages
export interface Message {
  id: string
  senderId: string
  recipientId: string | null
  dutySessionId: string | null
  message: string
  isRead: boolean
  createdAt: Date
  // Relations
  sender: User
  recipient?: User | null
  dutySession?: DutySession | null
}

// Notifications
export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'ALERT'
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Notification {
  id: string
  userId: string | null
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  dismissible: boolean
  dismissedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// API Response Types
export type Result<T> =
  | { ok: true; data: T; message?: string; meta?: Record<string, unknown> }
  | { ok: false; message: string; code?: string; meta?: Record<string, unknown> }

// Query Params
export interface GetLogsParams {
  locationId?: string
  type?: LogType
  status?: RecordStatus
  startDate?: string
  endDate?: string
  search?: string
  skip?: number
  take?: number
}

export interface GetShiftsParams {
  startDate: string
  endDate: string
  locationId?: string
  userId?: string
}

// Form Inputs (from Zod schemas)
export interface CreateLogInput {
  type: LogType
  title: string
  description: string
  locationId: string
  shiftId?: string
  status: RecordStatus
}

export interface UpdateLogInput extends Partial<CreateLogInput> {}

export interface ClockInInput {
  locationId: string
  shiftId?: string
}

export interface ChecklistSubmission {
  itemId: string
  checked: boolean
  notes?: string
}
```

---

## React Native Client Library

**File (RN App):** `lib/api/client.ts`

```typescript
import axios, { type AxiosInstance } from 'axios'
import type { Result } from '../types'
import type {
  User,
  DutySession,
  Location,
  Log,
  Shift,
  SafetyChecklistItem,
  Message,
  Notification,
  GetLogsParams,
  GetShiftsParams,
  CreateLogInput,
  UpdateLogInput,
  ClockInInput,
  ChecklistSubmission,
} from '../types'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/mobile'

export class ApiClient {
  private client: AxiosInstance
  private getToken: () => Promise<string | null>

  constructor(getToken: () => Promise<string | null>) {
    this.getToken = getToken
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000, // 15 second timeout
    })

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - maybe trigger sign out
          console.error('Unauthorized - session expired')
        }
        return Promise.reject(error)
      }
    )
  }

  // ============================================
  // AUTHENTICATION & USER
  // ============================================

  async getCurrentUser(): Promise<Result<User>> {
    const { data } = await this.client.get<Result<User>>('/auth/user')
    return data
  }

  async syncUser(): Promise<Result<User>> {
    const { data } = await this.client.post<Result<User>>('/auth/sync')
    return data
  }

  // ============================================
  // DUTY MANAGEMENT
  // ============================================

  async getActiveDutySession(): Promise<Result<DutySession | null>> {
    const { data } = await this.client.get<Result<DutySession | null>>('/duty/active')
    return data
  }

  async clockIn(input: ClockInInput): Promise<Result<DutySession>> {
    const { data } = await this.client.post<Result<DutySession>>('/duty/clock-in', input)
    return data
  }

  async clockOut(dutySessionId: string): Promise<Result<DutySession>> {
    const { data } = await this.client.post<Result<DutySession>>('/duty/clock-out', {
      dutySessionId,
    })
    return data
  }

  // ============================================
  // SAFETY CHECKLIST
  // ============================================

  async getSafetyChecklistItems(): Promise<Result<SafetyChecklistItem[]>> {
    const { data } = await this.client.get<Result<SafetyChecklistItem[]>>('/safety/items')
    return data
  }

  async submitSafetyChecklist(
    dutySessionId: string,
    items: ChecklistSubmission[]
  ): Promise<Result<{ responseId: string; logId: string }>> {
    const { data } = await this.client.post<Result<{ responseId: string; logId: string }>>(
      '/safety/submit',
      { dutySessionId, items }
    )
    return data
  }

  // ============================================
  // LOCATIONS
  // ============================================

  async getActiveLocations(): Promise<Result<Location[]>> {
    const { data } = await this.client.get<Result<Location[]>>('/locations/active')
    return data
  }

  // ============================================
  // LOGS
  // ============================================

  async getLogs(params?: GetLogsParams): Promise<Result<{ logs: Log[]; total: number }>> {
    const { data } = await this.client.get<Result<{ logs: Log[]; total: number }>>('/logs', {
      params,
    })
    return data
  }

  async getLogById(id: string): Promise<Result<Log>> {
    const { data } = await this.client.get<Result<Log>>(`/logs/${id}`)
    return data
  }

  async createLog(logData: CreateLogInput): Promise<Result<Log>> {
    const { data } = await this.client.post<Result<Log>>('/logs', logData)
    return data
  }

  async updateLog(id: string, logData: UpdateLogInput): Promise<Result<Log>> {
    const { data } = await this.client.patch<Result<Log>>(`/logs/${id}`, logData)
    return data
  }

  async deleteLog(id: string): Promise<Result<{ id: string }>> {
    const { data } = await this.client.delete<Result<{ id: string }>>(`/logs/${id}`)
    return data
  }

  // ============================================
  // SHIFTS
  // ============================================

  async getShifts(params: GetShiftsParams): Promise<Result<Shift[]>> {
    const { data } = await this.client.get<Result<Shift[]>>('/shifts', { params })
    return data
  }

  // ============================================
  // MESSAGES
  // ============================================

  async getMyMessages(): Promise<Result<Message[]>> {
    const { data } = await this.client.get<Result<Message[]>>('/messages')
    return data
  }

  async sendMessage(message: string, dutySessionId: string): Promise<Result<Message>> {
    const { data } = await this.client.post<Result<Message>>('/messages', {
      message,
      dutySessionId,
    })
    return data
  }

  async markMessageAsRead(messageId: string): Promise<Result<Message>> {
    const { data } = await this.client.patch<Result<Message>>(`/messages/${messageId}/read`)
    return data
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async getNotifications(): Promise<Result<Notification[]>> {
    const { data } = await this.client.get<Result<Notification[]>>('/notifications')
    return data
  }

  async dismissNotification(id: string): Promise<Result<Notification>> {
    const { data } = await this.client.patch<Result<Notification>>(`/notifications/${id}/dismiss`)
    return data
  }
}

// Hook to create API client with Clerk auth
export function createApiClient(getToken: () => Promise<string | null>): ApiClient {
  return new ApiClient(getToken)
}
```

---

## React Query Hooks

**File (RN App):** `lib/api/hooks.ts`

```typescript
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-expo'
import { createApiClient } from './client'
import type { Result } from '../types'

// Custom hook to get API client with auth
export function useApiClient() {
  const { getToken } = useAuth()
  return createApiClient(getToken)
}

// ============================================
// DUTY HOOKS
// ============================================

export function useActiveDutySession() {
  const api = useApiClient()

  return useQuery({
    queryKey: ['duty', 'active'],
    queryFn: async () => {
      const result = await api.getActiveDutySession()
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    refetchInterval: 30000, // Poll every 30 seconds
  })
}

export function useClockIn() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { locationId: string; shiftId?: string }) => {
      const result = await api.clockIn(input)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duty', 'active'] })
    },
  })
}

export function useClockOut() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dutySessionId: string) => {
      const result = await api.clockOut(dutySessionId)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duty', 'active'] })
    },
  })
}

// ============================================
// SAFETY CHECKLIST HOOKS
// ============================================

export function useSafetyChecklistItems() {
  const api = useApiClient()

  return useQuery({
    queryKey: ['safety', 'items'],
    queryFn: async () => {
      const result = await api.getSafetyChecklistItems()
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}

export function useSubmitSafetyChecklist() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      dutySessionId,
      items,
    }: {
      dutySessionId: string
      items: Array<{ itemId: string; checked: boolean; notes?: string }>
    }) => {
      const result = await api.submitSafetyChecklist(dutySessionId, items)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duty', 'active'] })
    },
  })
}

// ============================================
// LOCATION HOOKS
// ============================================

export function useActiveLocations() {
  const api = useApiClient()

  return useQuery({
    queryKey: ['locations', 'active'],
    queryFn: async () => {
      const result = await api.getActiveLocations()
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    staleTime: 1000 * 60 * 60, // Locations rarely change - cache for 1 hour
  })
}

// ============================================
// LOG HOOKS
// ============================================

export function useLogs(params?: any) {
  const api = useApiClient()

  return useQuery({
    queryKey: ['logs', params],
    queryFn: async () => {
      const result = await api.getLogs(params)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}

export function useLog(id: string) {
  const api = useApiClient()

  return useQuery({
    queryKey: ['logs', id],
    queryFn: async () => {
      const result = await api.getLogById(id)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    enabled: !!id,
  })
}

export function useCreateLog() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (logData: any) => {
      const result = await api.createLog(logData)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
  })
}

export function useUpdateLog() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const result = await api.updateLog(id, data)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      queryClient.invalidateQueries({ queryKey: ['logs', data.id] })
    },
  })
}

export function useDeleteLog() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await api.deleteLog(id)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
  })
}

// ============================================
// SHIFT HOOKS
// ============================================

export function useShifts(params: { startDate: string; endDate: string }) {
  const api = useApiClient()

  return useQuery({
    queryKey: ['shifts', params],
    queryFn: async () => {
      const result = await api.getShifts(params)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}

// ============================================
// MESSAGE HOOKS
// ============================================

export function useMyMessages() {
  const api = useApiClient()

  return useQuery({
    queryKey: ['messages', 'my'],
    queryFn: async () => {
      const result = await api.getMyMessages()
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    refetchInterval: 30000, // Poll every 30 seconds
  })
}

export function useSendMessage() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ message, dutySessionId }: { message: string; dutySessionId: string }) => {
      const result = await api.sendMessage(message, dutySessionId)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}

// ============================================
// NOTIFICATION HOOKS
// ============================================

export function useNotifications() {
  const api = useApiClient()

  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const result = await api.getNotifications()
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    refetchInterval: 30000, // Poll every 30 seconds
  })
}

export function useDismissNotification() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await api.dismissNotification(id)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
```

---

## Usage Example in React Native Component

```typescript
// app/(tabs)/index.tsx - Home Screen
import { View, Text, Button } from 'react-native'
import { useActiveDutySession, useClockIn, useClockOut } from '@/lib/api/hooks'
import { DutyStatusCard } from '@/components/duty/DutyStatusCard'
import { toast } from 'sonner-native' // or react-native-toast-message

export default function HomeScreen() {
  const { data: dutySession, isLoading } = useActiveDutySession()
  const clockInMutation = useClockIn()
  const clockOutMutation = useClockOut()

  const handleClockIn = async (locationId: string, shiftId?: string) => {
    try {
      await clockInMutation.mutateAsync({ locationId, shiftId })
      toast.success('Clocked in successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to clock in')
    }
  }

  const handleClockOut = async () => {
    if (!dutySession) return

    try {
      await clockOutMutation.mutateAsync(dutySession.id)
      toast.success('Clocked out successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to clock out')
    }
  }

  if (isLoading) {
    return <View><Text>Loading...</Text></View>
  }

  return (
    <View className="p-4">
      <DutyStatusCard
        dutySession={dutySession}
        onClockIn={() => {
          // Open clock in modal
        }}
        onClockOut={handleClockOut}
      />
    </View>
  )
}
```

---

## Next Steps

1. **Create the auth middleware** (`lib/api/auth-middleware.ts`)
2. **Create API routes** for each resource (duty, logs, etc.)
3. **Test each API route** with Postman or Insomnia
4. **Set up React Native project** with Expo
5. **Create API client and hooks** in RN app
6. **Build first screen** (Home with duty status)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-11
