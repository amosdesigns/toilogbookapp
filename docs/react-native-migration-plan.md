# React Native Migration Plan
## Town of Islip Marina Guard Mobile App

**Last Updated:** 2026-01-11
**Status:** Planning Phase
**Target Platform:** iOS & Android (React Native + Expo)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Migration Strategy](#migration-strategy)
4. [API Layer Development](#api-layer-development)
5. [React Native App Architecture](#react-native-app-architecture)
6. [Component Migration Map](#component-migration-map)
7. [Authentication & Authorization](#authentication--authorization)
8. [Data Management](#data-management)
9. [Implementation Phases](#implementation-phases)
10. [Technical Specifications](#technical-specifications)
11. [Risk Assessment](#risk-assessment)
12. [Testing Strategy](#testing-strategy)

---

## Executive Summary

### Project Goals

The goal is to migrate the current Next.js public interface (guard-facing mobile-first web app) to a native React Native mobile application while maintaining compatibility with the existing Next.js admin backend.

### Key Constraints

- **Backend Preservation:** Admin backend (`/(admin)`) remains Next.js with no changes
- **Database Schema:** No changes to PostgreSQL schema (Prisma models)
- **API Compatibility:** New mobile app must integrate with existing server actions via API wrapper layer
- **Authentication:** Migrate from `@clerk/nextjs` to `@clerk/expo` (React Native)
- **Code Reuse:** Maximize TypeScript type and validation schema reuse

### Success Criteria

- [ ] Native iOS/Android app with feature parity to current public interface
- [ ] Seamless authentication across web admin and mobile app
- [ ] Real-time duty status updates
- [ ] Offline capability for critical features (clock in/out, view logs)
- [ ] <100ms perceived response time for core actions
- [ ] 99.9% crash-free users

---

## Current Architecture Analysis

### Public Interface Pages (to be migrated)

| Route | Purpose | Key Features |
|-------|---------|-------------|
| `/` | Home/Dashboard | Duty status card, clock in/out, safety checklist, quick actions |
| `/logs` | Logbook | Location-filtered logs, create/edit/delete logs, incident reporting |
| `/shifts` | Schedule | 9-day shift calendar, assigned shifts highlighting |
| `/messages` | Communication | Send messages to supervisors, view conversation threads |
| `/profile` | User Profile | View/edit profile information |

### Component Inventory

**Duty Management:**
- `DutyStatusCard` - Shows clock in/out status, time elapsed
- `ClockInDialog` - Modal with location selection + safety checklist
- `SafetyChecklistDialog` - Standalone safety equipment verification
- `LocationCheckInDialog` - Supervisor location check-in (future feature)

**Forms:**
- `LogForm` - Create/edit logs with validation
- Form components use `react-hook-form` + `zod` validation

**Layout:**
- `MobileHeader` - Sticky top header with duty status badge
- `MobileNav` - Bottom tab navigation (5 tabs)
- `AuthenticatedLayoutWrapper` - Notification banner wrapper

**UI Components (shadcn/ui - Radix primitives):**
- Dialogs, Forms, Inputs, Textareas, Buttons, Cards, Checkboxes, Select dropdowns
- All styled with Tailwind CSS

### Server Actions Currently Used

**Authentication & User:**
- `getCurrentUserWithSync()` - Get user from DB, sync from Clerk if needed
- `getCurrentUser()` - Get user without sync

**Duty Management:**
- `getActiveDutySession()` - Check if user is on duty
- `clockIn({ locationId, shiftId })` - Clock in at location
- `clockOut(dutySessionId)` - Clock out
- `getSafetyChecklistItems()` - Get safety checklist
- `submitSafetyChecklist({ dutySessionId, items })` - Submit checklist

**Location:**
- `getActiveLocations()` - Get all active marina locations

**Logs:**
- `getLogs({ locationId, type, status, startDate, endDate, search })` - Query logs
- `getLogById(id)` - Get single log with relations
- `createLog(data)` - Create new log
- `updateLog(id, data)` - Update existing log
- `deleteLog(id)` - Soft delete (archive)

**Shifts:**
- `getShifts({ startDate, endDate, locationId, userId })` - Query shifts

**Messages:**
- `sendGuardMessage({ message, dutySessionId })` - Send to supervisors
- `getMyMessages()` - Get messages for current duty session

**Notifications:**
- `getNotifications()` - Get active notifications
- `dismissNotification(id)` - Mark as dismissed

### Data Flow Pattern

All server actions return `Result<T>` type:

```typescript
// Success
{ ok: true, data: T, message?: string }

// Error
{ ok: false, message: string, code?: string, meta?: { errors?: ... } }
```

**Example Flow - Clock In:**

1. User opens ClockInDialog
2. Fetch safety checklist items: `getSafetyChecklistItems()`
3. User selects location, completes checklist
4. Submit: `clockIn({ locationId, shiftId })`
5. Get new session: `getActiveDutySession()`
6. Submit checklist: `submitSafetyChecklist({ dutySessionId, items })`
7. Auto-generates log entry
8. Refresh UI to show "On Duty" status

---

## Migration Strategy

### Phased Approach

**Phase 1: API Layer (Week 1-2)**
- Create API route wrappers for all server actions
- Implement authentication middleware for API routes
- Test API endpoints with Postman/Insomnia

**Phase 2: React Native Setup (Week 2-3)**
- Initialize Expo project with TypeScript
- Set up Clerk authentication for React Native
- Configure navigation (React Navigation)
- Set up state management (React Query + Zustand)

**Phase 3: Core Features (Week 3-5)**
- Duty management (clock in/out, safety checklist)
- Home screen with duty status
- Bottom tab navigation

**Phase 4: Logbook & Shifts (Week 5-7)**
- Logs list, create/edit/delete
- Shift calendar view
- Incident reporting

**Phase 5: Messaging & Profile (Week 7-8)**
- Messages screen
- Profile view/edit
- Notifications

**Phase 6: Testing & Polish (Week 8-10)**
- E2E testing
- Offline mode
- Performance optimization
- Beta testing with guards

**Phase 7: Deployment (Week 10-12)**
- App Store submission (iOS)
- Google Play submission (Android)
- Production rollout

---

## API Layer Development

### Critical: Server Actions → API Routes

Next.js Server Actions **cannot be called from React Native**. They require Next.js client-side libraries and use internal `/_rsc/` endpoints.

**Solution:** Create standard HTTP API routes that wrap server actions.

### API Route Structure

```
app/
  api/
    mobile/           # All mobile API routes
      auth/
        sync/route.ts              # POST - Sync user from Clerk
        user/route.ts              # GET - Get current user
      duty/
        active/route.ts            # GET - Get active duty session
        clock-in/route.ts          # POST - Clock in
        clock-out/route.ts         # POST - Clock out
      safety/
        items/route.ts             # GET - Get checklist items
        submit/route.ts            # POST - Submit checklist
      locations/
        active/route.ts            # GET - Get active locations
      logs/
        route.ts                   # GET (query), POST (create)
        [id]/route.ts              # GET (single), PATCH (update), DELETE
      shifts/
        route.ts                   # GET - Query shifts
      messages/
        route.ts                   # GET (list), POST (send)
        [id]/read/route.ts         # PATCH - Mark as read
      notifications/
        route.ts                   # GET - Get notifications
        [id]/dismiss/route.ts      # PATCH - Dismiss notification
```

### API Route Pattern

```typescript
// app/api/mobile/duty/clock-in/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { clockIn } from '@/lib/actions/duty-session-actions'
import { validateClerkToken, getUserFromToken } from '@/lib/api/auth-middleware'
import { z } from 'zod'

// Request validation schema
const clockInRequestSchema = z.object({
  locationId: z.string().cuid(),
  shiftId: z.string().cuid().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Validate Clerk token from Authorization header
    const token = await validateClerkToken(req)
    if (!token.ok) {
      return NextResponse.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get user from database
    const user = await getUserFromToken(token.data.userId)
    if (!user) {
      return NextResponse.json(
        { ok: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // 3. Parse request body
    const body = await req.json()
    const validation = clockInRequestSchema.safeParse(body)

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

    // 4. Call server action (server actions already have getCurrentUser() internally)
    const result = await clockIn(validation.data)

    // 5. Return result (Result<T> already in correct format)
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

### Authentication Middleware

```typescript
// lib/api/auth-middleware.ts
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Result } from '@/lib/utils/RenderError'

export async function validateClerkToken(
  req: NextRequest
): Promise<Result<{ userId: string }>> {
  try {
    // Get Clerk session from Authorization header
    const { userId } = await auth()

    if (!userId) {
      return { ok: false, message: 'No valid session' }
    }

    return { ok: true, data: { userId } }
  } catch (error) {
    return { ok: false, message: 'Invalid token' }
  }
}

export async function getUserFromToken(clerkUserId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    })
    return user
  } catch (error) {
    console.error('[AUTH_MIDDLEWARE] Error fetching user:', error)
    return null
  }
}
```

### API Client Library for React Native

```typescript
// mobile-app/lib/api-client.ts
import axios, { type AxiosInstance } from 'axios'
import { useAuth } from '@clerk/clerk-expo'
import type { Result } from './types'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/mobile'

class ApiClient {
  private client: AxiosInstance
  private getToken: () => Promise<string | null>

  constructor(getToken: () => Promise<string | null>) {
    this.getToken = getToken
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add auth interceptor
    this.client.interceptors.request.use(async (config) => {
      const token = await this.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })
  }

  // Duty Management
  async getActiveDutySession() {
    const { data } = await this.client.get<Result<DutySession | null>>('/duty/active')
    return data
  }

  async clockIn(locationId: string, shiftId?: string) {
    const { data } = await this.client.post<Result<DutySession>>('/duty/clock-in', {
      locationId,
      shiftId,
    })
    return data
  }

  async clockOut(dutySessionId: string) {
    const { data } = await this.client.post<Result<DutySession>>('/duty/clock-out', {
      dutySessionId,
    })
    return data
  }

  // Safety Checklist
  async getSafetyChecklistItems() {
    const { data } = await this.client.get<Result<SafetyChecklistItem[]>>('/safety/items')
    return data
  }

  async submitSafetyChecklist(dutySessionId: string, items: ChecklistSubmission[]) {
    const { data } = await this.client.post<Result<{ responseId: string; logId: string }>>('/safety/submit', {
      dutySessionId,
      items,
    })
    return data
  }

  // Locations
  async getActiveLocations() {
    const { data } = await this.client.get<Result<Location[]>>('/locations/active')
    return data
  }

  // Logs
  async getLogs(params?: GetLogsParams) {
    const { data } = await this.client.get<Result<{ logs: Log[]; total: number }>>('/logs', {
      params,
    })
    return data
  }

  async getLogById(id: string) {
    const { data } = await this.client.get<Result<Log>>(`/logs/${id}`)
    return data
  }

  async createLog(logData: CreateLogInput) {
    const { data } = await this.client.post<Result<Log>>('/logs', logData)
    return data
  }

  async updateLog(id: string, logData: UpdateLogInput) {
    const { data } = await this.client.patch<Result<Log>>(`/logs/${id}`, logData)
    return data
  }

  async deleteLog(id: string) {
    const { data } = await this.client.delete<Result<{ id: string }>>(`/logs/${id}`)
    return data
  }

  // Shifts
  async getShifts(params: GetShiftsParams) {
    const { data } = await this.client.get<Result<Shift[]>>('/shifts', { params })
    return data
  }

  // Messages
  async getMyMessages() {
    const { data } = await this.client.get<Result<Message[]>>('/messages')
    return data
  }

  async sendMessage(message: string, dutySessionId: string) {
    const { data } = await this.client.post<Result<Message>>('/messages', {
      message,
      dutySessionId,
    })
    return data
  }

  // Notifications
  async getNotifications() {
    const { data } = await this.client.get<Result<Notification[]>>('/notifications')
    return data
  }

  async dismissNotification(id: string) {
    const { data } = await this.client.patch<Result<Notification>>(`/notifications/${id}/dismiss`)
    return data
  }
}

// Hook to use API client with auth
export function useApiClient() {
  const { getToken } = useAuth()
  return new ApiClient(getToken)
}
```

---

## React Native App Architecture

### Tech Stack

**Core:**
- **React Native:** 0.73+ (latest stable)
- **Expo:** SDK 50+ (managed workflow for easier development)
- **TypeScript:** 5.3+ (strict mode)

**Navigation:**
- **React Navigation 6:** Tab navigation + stack navigation
- Bottom tabs for main screens (Home, Logs, Shifts, Messages, Profile)

**State Management:**
- **React Query (TanStack Query):** Server state, caching, optimistic updates
- **Zustand:** Local UI state (duty status, notifications)
- **AsyncStorage:** Offline persistence

**Forms:**
- **react-hook-form:** Form state management
- **zod:** Validation schemas (reused from web app)

**UI Components:**
- **NativeWind (Tailwind for RN):** Consistent styling with web app
- **React Native Paper:** Material Design components (alternative to shadcn/ui)
- **Expo Icons:** Icons (lucide-react equivalents)

**Authentication:**
- **@clerk/clerk-expo:** Clerk authentication for React Native
- **expo-secure-store:** Secure token storage

**Networking:**
- **axios:** HTTP client with interceptors
- **react-query:** Request caching and deduplication

**Development Tools:**
- **Expo Go:** Testing on physical devices
- **React Native Debugger:** Debugging
- **Flipper:** Network inspection, state debugging

### Project Structure

```
mobile-app/
├── app/                          # Expo Router app directory
│   ├── (auth)/                   # Auth screens
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/                   # Main app screens (bottom tabs)
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── index.tsx             # Home/Dashboard
│   │   ├── logs.tsx              # Logs screen
│   │   ├── shifts.tsx            # Shifts screen
│   │   ├── messages.tsx          # Messages screen
│   │   └── profile.tsx           # Profile screen
│   ├── log/
│   │   ├── [id].tsx              # View log details
│   │   └── create.tsx            # Create log
│   └── _layout.tsx               # Root layout
├── components/                   # Reusable components
│   ├── duty/
│   │   ├── DutyStatusCard.tsx
│   │   ├── ClockInSheet.tsx      # Bottom sheet instead of dialog
│   │   └── SafetyChecklistSheet.tsx
│   ├── forms/
│   │   └── LogForm.tsx
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── Sheet.tsx
│   └── layouts/
│       ├── ScreenHeader.tsx
│       └── NotificationBanner.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts             # API client
│   │   └── hooks.ts              # React Query hooks
│   ├── auth/
│   │   └── clerk.ts              # Clerk config
│   ├── store/
│   │   ├── duty.ts               # Duty status store
│   │   └── notifications.ts      # Notifications store
│   ├── utils/
│   │   ├── date.ts               # Date formatting
│   │   └── validation.ts         # Zod schemas (copied from web)
│   └── types/
│       └── index.ts              # TypeScript types (copied from web)
├── hooks/
│   ├── useDutyStatus.ts          # Duty status hook
│   ├── useLogs.ts                # Logs data hook
│   └── useNotifications.ts       # Notifications hook
├── constants/
│   ├── Colors.ts                 # Theme colors
│   └── Config.ts                 # App config
└── app.json                      # Expo config
```

### Navigation Structure

```
Root Navigator (Stack)
├── Auth Flow (if not signed in)
│   ├── Sign In
│   └── Sign Up
└── Main App (if signed in)
    └── Bottom Tabs
        ├── Home (Stack)
        │   ├── Dashboard
        │   └── Clock In Modal
        ├── Logs (Stack)
        │   ├── Logs List
        │   ├── Log Details
        │   └── Create/Edit Log
        ├── Shifts (Stack)
        │   └── Shifts Calendar
        ├── Messages (Stack)
        │   └── Messages List
        └── Profile (Stack)
            ├── Profile View
            └── Edit Profile
```

---

## Component Migration Map

### Home Screen (Dashboard)

**Web Component:** `app/(public)/page.tsx`

**React Native Equivalent:**

```typescript
// app/(tabs)/index.tsx
import { View, ScrollView, RefreshControl } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DutyStatusCard } from '@/components/duty/DutyStatusCard'
import { ClockInSheet } from '@/components/duty/ClockInSheet'
import { QuickActions } from '@/components/home/QuickActions'
import { useApiClient } from '@/lib/api/client'
import { useState } from 'react'

export default function HomeScreen() {
  const api = useApiClient()
  const queryClient = useQueryClient()
  const [showClockIn, setShowClockIn] = useState(false)

  // Fetch active duty session
  const { data: dutySession, isLoading, refetch } = useQuery({
    queryKey: ['duty', 'active'],
    queryFn: () => api.getActiveDutySession(),
    refetchInterval: 30000, // Poll every 30s
  })

  // Fetch locations for clock in
  const { data: locations } = useQuery({
    queryKey: ['locations', 'active'],
    queryFn: () => api.getActiveLocations(),
  })

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: (dutySessionId: string) => api.clockOut(dutySessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duty', 'active'] })
    },
  })

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      <View className="p-4 space-y-4">
        <DutyStatusCard
          dutySession={dutySession?.data}
          onClockIn={() => setShowClockIn(true)}
          onClockOut={() => clockOutMutation.mutate(dutySession!.data!.id)}
        />

        <QuickActions isOnDuty={!!dutySession?.data} />
      </View>

      <ClockInSheet
        visible={showClockIn}
        onClose={() => setShowClockIn(false)}
        locations={locations?.data || []}
      />
    </ScrollView>
  )
}
```

**Key Differences:**
- Use `ScrollView` instead of `div` with padding
- Use `RefreshControl` for pull-to-refresh
- Use bottom sheet (`ClockInSheet`) instead of dialog
- Use React Query for data fetching and caching

### Logs Screen

**Web Component:** `app/(public)/logs/page.tsx`

**React Native Equivalent:**

```typescript
// app/(tabs)/logs.tsx
import { View, FlatList } from 'react-native'
import { useInfiniteQuery } from '@tanstack/react-query'
import { LogCard } from '@/components/logs/LogCard'
import { LogFilters } from '@/components/logs/LogFilters'
import { useApiClient } from '@/lib/api/client'
import { useState } from 'react'

export default function LogsScreen() {
  const api = useApiClient()
  const [filters, setFilters] = useState({
    locationId: '',
    type: undefined,
    status: undefined,
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['logs', filters],
    queryFn: ({ pageParam = 0 }) =>
      api.getLogs({ ...filters, skip: pageParam * 10, take: 10 }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.data.logs.length === 10 ? pages.length : undefined,
  })

  const logs = data?.pages.flatMap((page) => page.data.logs) || []

  return (
    <View className="flex-1">
      <LogFilters filters={filters} onChange={setFilters} />

      <FlatList
        data={logs}
        renderItem={({ item }) => <LogCard log={item} />}
        keyExtractor={(item) => item.id}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <LoadingSpinner /> : null}
      />
    </View>
  )
}
```

**Key Differences:**
- Use `FlatList` for optimized list rendering (virtualization)
- Use infinite scroll with `useInfiniteQuery` instead of pagination
- Collapsible filters in bottom sheet instead of inline

### Shifts Screen

**Web Component:** `app/(public)/shifts/page.tsx`

**React Native Equivalent:**

```typescript
// app/(tabs)/shifts.tsx
import { View, FlatList } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { ShiftDayCard } from '@/components/shifts/ShiftDayCard'
import { useApiClient } from '@/lib/api/client'
import { subDays, addDays, format } from 'date-fns'

export default function ShiftsScreen() {
  const api = useApiClient()
  const today = new Date()
  const startDate = subDays(today, 1) // Yesterday
  const endDate = addDays(today, 7) // +7 days

  const { data: shifts } = useQuery({
    queryKey: ['shifts', startDate, endDate],
    queryFn: () => api.getShifts({ startDate, endDate }),
  })

  // Group shifts by day
  const groupedShifts = groupShiftsByDay(shifts?.data || [])

  return (
    <View className="flex-1">
      <FlatList
        horizontal
        data={Object.keys(groupedShifts)}
        renderItem={({ item: date }) => (
          <ShiftDayCard
            date={date}
            shifts={groupedShifts[date]}
            isToday={format(new Date(), 'yyyy-MM-dd') === date}
          />
        )}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        snapToInterval={280} // Card width
        decelerationRate="fast"
      />
    </View>
  )
}
```

**Key Differences:**
- Horizontal `FlatList` for scrollable days
- Snap-to-interval for smooth card scrolling
- Similar card design with NativeWind

---

## Authentication & Authorization

### Clerk Setup for React Native

**Install Dependencies:**

```bash
npm install @clerk/clerk-expo expo-secure-store expo-web-browser
```

**Configure Clerk:**

```typescript
// lib/auth/clerk.ts
import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'

// Token cache for secure storage
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key)
    } catch (err) {
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value)
    } catch (err) {
      return
    }
  },
}

export { ClerkProvider, tokenCache, useAuth }
```

**App Layout with Clerk:**

```typescript
// app/_layout.tsx
import { ClerkProvider } from '@/lib/auth/clerk'
import { Stack } from 'expo-router'

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ClerkProvider>
  )
}
```

### User Sync Flow

**On App Launch:**

1. User signs in with Clerk
2. App gets Clerk token
3. Call `POST /api/mobile/auth/sync` to sync user to database
4. Store user data in local state

**React Query Hook:**

```typescript
// hooks/useUser.ts
import { useAuth } from '@clerk/clerk-expo'
import { useQuery } from '@tanstack/react-query'
import { useApiClient } from '@/lib/api/client'

export function useUser() {
  const { isSignedIn } = useAuth()
  const api = useApiClient()

  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: () => api.getCurrentUser(),
    enabled: isSignedIn,
  })
}
```

### Authorization Checks

**Reuse Web App Authorization Utilities:**

```typescript
// lib/utils/auth.ts (copied from web app)
export { hasRole, canManageResource, isAdmin } from '@/lib/utils/auth'
```

**Usage in Components:**

```typescript
const { data: user } = useUser()

if (!canManageResource(user.role, user.id, log.userId)) {
  // Hide edit/delete buttons
}
```

---

## Data Management

### React Query Configuration

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

// Persist query cache to AsyncStorage for offline support
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
})

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
})
```

### Zustand Stores

**Duty Status Store:**

```typescript
// lib/store/duty.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface DutyState {
  isOnDuty: boolean
  locationName: string | null
  clockInTime: Date | null
  setDutyStatus: (isOnDuty: boolean, locationName?: string, clockInTime?: Date) => void
}

export const useDutyStore = create<DutyState>()(
  persist(
    (set) => ({
      isOnDuty: false,
      locationName: null,
      clockInTime: null,
      setDutyStatus: (isOnDuty, locationName, clockInTime) =>
        set({ isOnDuty, locationName, clockInTime }),
    }),
    {
      name: 'duty-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

### Offline Support

**Optimistic Updates:**

```typescript
// Example: Clock out mutation with optimistic update
const clockOutMutation = useMutation({
  mutationFn: (dutySessionId: string) => api.clockOut(dutySessionId),
  onMutate: async (dutySessionId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['duty', 'active'] })

    // Snapshot previous value
    const previous = queryClient.getQueryData(['duty', 'active'])

    // Optimistically update
    queryClient.setQueryData(['duty', 'active'], (old: any) => ({
      ...old,
      data: null, // No active duty
    }))

    return { previous }
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['duty', 'active'], context?.previous)
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['duty', 'active'] })
  },
})
```

**Offline Queue:**

```typescript
// lib/offline-queue.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'

interface QueuedAction {
  id: string
  type: 'clockIn' | 'clockOut' | 'createLog' | 'updateLog'
  data: any
  timestamp: number
}

class OfflineQueue {
  private queue: QueuedAction[] = []

  async addToQueue(action: Omit<QueuedAction, 'timestamp'>) {
    const queuedAction = { ...action, timestamp: Date.now() }
    this.queue.push(queuedAction)
    await AsyncStorage.setItem('offline-queue', JSON.stringify(this.queue))
  }

  async processQueue(api: ApiClient) {
    const isConnected = await NetInfo.fetch().then((state) => state.isConnected)
    if (!isConnected || this.queue.length === 0) return

    for (const action of this.queue) {
      try {
        // Execute action based on type
        if (action.type === 'clockIn') {
          await api.clockIn(action.data.locationId, action.data.shiftId)
        }
        // ... handle other types

        // Remove from queue on success
        this.queue = this.queue.filter((a) => a.id !== action.id)
      } catch (error) {
        console.error('Failed to process queued action:', error)
      }
    }

    await AsyncStorage.setItem('offline-queue', JSON.stringify(this.queue))
  }
}

export const offlineQueue = new OfflineQueue()
```

---

## Implementation Phases

### Phase 1: API Layer (2 weeks)

**Tasks:**
- [ ] Create API route structure (`/api/mobile/...`)
- [ ] Implement authentication middleware with Clerk token validation
- [ ] Create API routes for all server actions:
  - [ ] Auth & user
  - [ ] Duty management
  - [ ] Safety checklist
  - [ ] Locations
  - [ ] Logs (CRUD + query)
  - [ ] Shifts
  - [ ] Messages
  - [ ] Notifications
- [ ] Test all API endpoints with Postman
- [ ] Document API endpoints in OpenAPI/Swagger

**Deliverables:**
- Fully functional API layer
- API documentation
- Postman collection for testing

### Phase 2: React Native Setup (1 week)

**Tasks:**
- [ ] Initialize Expo project with TypeScript
- [ ] Set up Clerk authentication for React Native
- [ ] Configure React Navigation (bottom tabs + stack)
- [ ] Set up React Query with persistence
- [ ] Create Zustand stores (duty, notifications)
- [ ] Set up NativeWind for styling
- [ ] Create base UI components (Button, Card, Input, etc.)

**Deliverables:**
- Working app shell with navigation
- Auth flow (sign in/up)
- Base component library

### Phase 3: Core Features (2 weeks)

**Tasks:**
- [ ] Home screen with duty status card
- [ ] Clock in flow with safety checklist
- [ ] Clock out functionality
- [ ] Bottom tab navigation
- [ ] Notification banner
- [ ] API client integration
- [ ] Real-time duty status polling

**Deliverables:**
- Functional duty management
- Home screen complete

### Phase 4: Logbook & Shifts (2 weeks)

**Tasks:**
- [ ] Logs list with filters
- [ ] Create log form
- [ ] Edit log functionality
- [ ] Delete log (soft delete)
- [ ] Log details view
- [ ] Incident severity badges
- [ ] Shift calendar (9-day view)
- [ ] Shift highlighting for assigned shifts

**Deliverables:**
- Complete logbook functionality
- Shift viewing

### Phase 5: Messaging & Profile (1 week)

**Tasks:**
- [ ] Messages list
- [ ] Send message to supervisors
- [ ] Message read status
- [ ] Profile view
- [ ] Edit profile form
- [ ] Profile photo upload (future)

**Deliverables:**
- Messaging feature
- Profile management

### Phase 6: Testing & Polish (2 weeks)

**Tasks:**
- [ ] E2E testing with Detox
- [ ] Unit tests for critical functions
- [ ] Offline mode testing
- [ ] Performance optimization (list virtualization, image optimization)
- [ ] Error handling and user feedback
- [ ] Loading states
- [ ] Pull-to-refresh on all screens
- [ ] Beta testing with 5-10 guards

**Deliverables:**
- Test coverage >80%
- Performance benchmarks
- Beta feedback report

### Phase 7: Deployment (2 weeks)

**Tasks:**
- [ ] Prepare app store assets (screenshots, description, privacy policy)
- [ ] iOS App Store submission
- [ ] Google Play Store submission
- [ ] Set up crash reporting (Sentry)
- [ ] Set up analytics (Amplitude/Mixpanel)
- [ ] Production deployment
- [ ] Rollout to all guards

**Deliverables:**
- Live app on iOS and Android
- Production monitoring

---

## Technical Specifications

### Environment Variables

```env
# Mobile App (.env)
EXPO_PUBLIC_API_URL=https://your-domain.com/api/mobile
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

# Backend (add to existing .env)
CLERK_SECRET_KEY=sk_live_...  # Existing
```

### Dependencies

**React Native App:**

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.0",
    "expo": "~50.0.0",
    "@clerk/clerk-expo": "^1.0.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-navigation/stack": "^6.3.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.5.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.50.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "nativewind": "^4.0.0",
    "expo-secure-store": "^12.8.0",
    "expo-router": "^3.4.0",
    "date-fns": "^3.0.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-native-community/netinfo": "^11.0.0"
  },
  "devDependencies": {
    "@types/react": "~18.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0"
  }
}
```

**Backend (add to existing package.json):**

No new dependencies needed - all API routes use existing server actions.

### Type Sharing

**Strategy:** Copy TypeScript types from web app to mobile app.

```typescript
// mobile-app/lib/types/index.ts
// Copied from web app /types/index.ts

export type Role = "SUPER_ADMIN" | "ADMIN" | "SUPERVISOR" | "GUARD"

export interface User {
  id: string
  clerkId: string
  email: string
  firstName: string | null
  lastName: string | null
  role: Role
  createdAt: Date
  updatedAt: Date
}

export interface DutySession {
  id: string
  userId: string
  locationId: string | null
  clockInTime: Date
  clockOutTime: Date | null
  shiftId: string | null
  notes: string | null
  location?: Location | null
  shift?: Shift | null
}

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
  createdAt: Date
  updatedAt: Date
  archivedAt: Date | null
  location: Location
  user: User
  shift?: Shift | null
}

// ... more types
```

**Alternative:** Publish shared types as npm package (e.g., `@toilogbook/shared-types`).

---

## Risk Assessment

### High Risk

**1. API Incompatibility**
- **Risk:** Server actions may not work correctly when wrapped in API routes
- **Mitigation:**
  - Test each API endpoint thoroughly
  - Ensure `getCurrentUser()` works correctly in API context
  - Add extensive logging

**2. Authentication Sync Issues**
- **Risk:** Users may exist in Clerk but not in database (sync failures)
- **Mitigation:**
  - Force sync on every API call until user exists in DB
  - Add retry logic for sync failures
  - Monitor sync errors in production

### Medium Risk

**3. Offline Data Conflicts**
- **Risk:** User clocks in offline, then online, causing duplicate sessions
- **Mitigation:**
  - Use idempotent API design (check for active session before creating new one)
  - Implement conflict resolution (last-write-wins)

**4. Performance on Low-End Devices**
- **Risk:** App may be slow on older Android devices
- **Mitigation:**
  - Use FlatList virtualization for all lists
  - Optimize images (use WebP, lazy loading)
  - Profile performance on low-end devices early

### Low Risk

**5. Push Notification Setup**
- **Risk:** Complex setup for notifications (APNs, FCM)
- **Mitigation:**
  - Use Expo push notifications (simpler)
  - Implement web push as fallback

---

## Testing Strategy

### Unit Tests

**Tools:** Jest + React Native Testing Library

**Coverage:**
- API client functions
- Zustand stores
- Utility functions (date formatting, validation)
- Custom hooks

**Example:**

```typescript
// __tests__/api/client.test.ts
import { ApiClient } from '@/lib/api/client'

describe('ApiClient', () => {
  it('should clock in successfully', async () => {
    const mockGetToken = jest.fn().mockResolvedValue('mock-token')
    const api = new ApiClient(mockGetToken)

    const result = await api.clockIn('location-123')

    expect(result.ok).toBe(true)
    expect(result.data).toHaveProperty('id')
  })
})
```

### Integration Tests

**Tools:** Detox (E2E testing for React Native)

**Test Scenarios:**
- Sign in flow
- Clock in/out flow
- Create log
- View shifts
- Send message

**Example:**

```typescript
// e2e/duty.test.ts
describe('Duty Management', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  it('should clock in successfully', async () => {
    // Navigate to home screen
    await element(by.id('home-tab')).tap()

    // Tap clock in button
    await element(by.id('clock-in-button')).tap()

    // Select location
    await element(by.id('location-select')).tap()
    await element(by.text('Atlantique Marina')).tap()

    // Complete safety checklist
    await element(by.id('safety-item-0-checkbox')).tap()
    await element(by.id('safety-item-1-checkbox')).tap()

    // Submit
    await element(by.id('clock-in-submit')).tap()

    // Verify on duty status
    await expect(element(by.text('On Duty'))).toBeVisible()
  })
})
```

### Manual Testing

**Beta Testing Plan:**
- Recruit 5-10 guards for beta testing
- Use TestFlight (iOS) and Google Play Internal Testing (Android)
- Collect feedback via Google Forms
- Focus on real-world usage scenarios

---

## Next Steps

### Immediate Actions (Week 1)

1. **Review and approve this plan** with stakeholders
2. **Set up development environment:**
   - Create new Expo project
   - Set up API route structure in Next.js app
3. **Create API authentication middleware**
4. **Build first API endpoint** (`/api/mobile/auth/user`) as proof of concept

### Short-Term (Weeks 2-4)

1. **Complete API layer** for all server actions
2. **Set up React Native app shell** with auth
3. **Implement core duty management** features

### Medium-Term (Weeks 5-8)

1. **Build out all screens** (logs, shifts, messages, profile)
2. **Implement offline support**
3. **Internal testing** with development team

### Long-Term (Weeks 9-12)

1. **Beta testing** with guards
2. **Polish and bug fixes**
3. **App store submission**
4. **Production rollout**

---

## Appendix

### Validation Schema Reuse

**Web App:** `/lib/validations/log.ts`

**Mobile App:** Copy to `/lib/validations/log.ts`

```typescript
// Can be used identically in React Native
import { z } from 'zod'

export const createLogSchema = z.object({
  type: z.enum(['INCIDENT', 'PATROL', 'VISITOR_CHECKIN', 'MAINTENANCE', 'WEATHER', 'OTHER']),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  locationId: z.string().cuid(),
  shiftId: z.string().cuid().optional(),
  status: z.enum(['LIVE', 'UPDATED', 'ARCHIVED', 'DRAFT']),
})

export type CreateLogInput = z.infer<typeof createLogSchema>
```

### API Endpoint Reference

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/mobile/auth/sync` | POST | Sync user to database | Clerk |
| `/api/mobile/auth/user` | GET | Get current user | Clerk |
| `/api/mobile/duty/active` | GET | Get active duty session | Clerk |
| `/api/mobile/duty/clock-in` | POST | Clock in | Clerk |
| `/api/mobile/duty/clock-out` | POST | Clock out | Clerk |
| `/api/mobile/safety/items` | GET | Get checklist items | Clerk |
| `/api/mobile/safety/submit` | POST | Submit checklist | Clerk |
| `/api/mobile/locations/active` | GET | Get active locations | Clerk |
| `/api/mobile/logs` | GET | Query logs | Clerk |
| `/api/mobile/logs` | POST | Create log | Clerk |
| `/api/mobile/logs/[id]` | GET | Get log by ID | Clerk |
| `/api/mobile/logs/[id]` | PATCH | Update log | Clerk |
| `/api/mobile/logs/[id]` | DELETE | Delete log | Clerk |
| `/api/mobile/shifts` | GET | Query shifts | Clerk |
| `/api/mobile/messages` | GET | Get messages | Clerk |
| `/api/mobile/messages` | POST | Send message | Clerk |
| `/api/mobile/notifications` | GET | Get notifications | Clerk |
| `/api/mobile/notifications/[id]/dismiss` | PATCH | Dismiss notification | Clerk |

---

**Document Version:** 1.0
**Last Updated:** 2026-01-11
**Author:** Senior Developer
**Reviewed By:** (Pending)
