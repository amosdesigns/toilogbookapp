# Server Actions Architecture

## Overview

This application uses **Next.js 16 Server Actions** for all internal data mutations and operations. Server Actions replace the older API Routes pattern for internal business logic, following modern Next.js best practices.

## 📚 What Are Server Actions?

Server Actions are **asynchronous functions that run on the server**. They're defined with the `'use server'` directive and can be called directly from Client or Server Components.

### Key Benefits:

1. **Type Safety** - Direct TypeScript function calls (no JSON serialization)
2. **Better DX** - No need to define API routes manually
3. **Progressive Enhancement** - Forms work without JavaScript
4. **Built-in Features** - Automatic revalidation, error handling, optimistic updates
5. **React 19 Integration** - Works with `useActionState`, `useFormStatus`, `useOptimistic`
6. **Less Boilerplate** - Simpler code compared to API routes
7. **Security** - Runs server-side, can't be called externally (unless exposed via API routes)

## 🏗️ Server Actions vs API Routes

### ✅ Use Server Actions For:
- **Form submissions** (clock in/out, create logs, etc.)
- **Data mutations** (create, update, delete operations)
- **Internal business logic** (review incidents, check-ins)
- **User-specific operations** (get current duty session)
- **Type-safe operations** requiring full TypeScript support

### ✅ Use API Routes For:
- **External webhooks** (Stripe payments, GitHub webhooks)
- **Public REST APIs** (mobile apps, third-party integrations)
- **Third-party services** that need HTTP endpoints
- **Custom HTTP methods/headers** requirements
- **Rate-limited endpoints** (easier to apply middleware)

## 📂 Server Actions in This Application

All Server Actions are located in `app/actions/` directory:

```
app/actions/
├── index.ts                    # Centralized exports
├── duty-sessions.ts            # Clock in/out operations
├── guards-on-duty.ts           # Monitor active guards
├── incidents.ts                # Incident review workflow
├── location-checkins.ts        # Supervisor location tracking
└── notifications.ts            # System notifications (placeholder)
```

---

## 🔐 1. Duty Sessions (`duty-sessions.ts`)

**Purpose**: Manage guard/supervisor clock-in and clock-out operations

### Actions:

#### `clockIn(data)`
- **Description**: Start a duty session
- **Guards**: Must select a specific location
- **Supervisors**: Start roaming duty (no location required)
- **Validates**: No duplicate active sessions
- **Returns**: Duty session with location/shift details
- **Revalidates**: `/dashboard`, `/`, `/admin/dashboard`

**Usage:**
```typescript
import { clockIn } from '@/app/actions'

const result = await clockIn({
  locationId: 'clx123...', // Required for guards, null for supervisors
  shiftId: 'clx456...'     // Optional
})

if (result.success) {
  console.log('Clocked in:', result.dutySession)
} else {
  console.error('Error:', result.error)
}
```

#### `clockOut(data)`
- **Description**: End a duty session
- **Validates**: User owns the session, not already clocked out
- **Optional**: End-of-shift notes
- **Revalidates**: `/dashboard`, `/`, `/admin/dashboard`

**Usage:**
```typescript
import { clockOut } from '@/app/actions'

const result = await clockOut({
  dutySessionId: 'clx789...',
  notes: 'Completed all rounds, no issues'
})
```

#### `getCurrentDutySession()`
- **Description**: Get active duty session for logged-in user
- **Includes**: Location, shift, and check-ins
- **Used**: To display duty status on UI

#### `getDutySession(dutySessionId)`
- **Description**: Fetch specific duty session details
- **Used**: History, reports, supervisor review

---

## 👮 2. Guards On Duty (`guards-on-duty.ts`)

**Purpose**: Supervisor dashboard to monitor all active guards

### Actions:

#### `getGuardsOnDuty()`
- **Description**: View all guards currently clocked in
- **Calculates**: Real-time hours on duty
- **Shows**: Location assignments, clock-in times
- **Restricted**: Supervisors, Admins, Super Admins only
- **Used**: Supervisor dashboard monitoring

**Usage:**
```typescript
import { getGuardsOnDuty } from '@/app/actions'

const result = await getGuardsOnDuty()

if (result.success) {
  result.guards.forEach(guard => {
    console.log(`${guard.name} at ${guard.locationName} - ${guard.hoursOnDuty}`)
  })
}
```

#### `forceClockOut(dutySessionId, notes?)`
- **Description**: Supervisor override to clock out a guard
- **Validates**: User is supervisor or above
- **Auto-adds**: Note indicating who forced clock-out
- **Revalidates**: `/admin/dashboard`, `/dashboard`

---

## 🚨 3. Incidents (`incidents.ts`)

**Purpose**: Incident review workflow for supervisors

### Actions:

#### `getUnreviewedIncidents()`
- **Description**: Fetch all unreviewed incidents
- **Sorted**: By severity (CRITICAL → HIGH → MEDIUM → LOW), then by date
- **Filters**: Only CRITICAL, HIGH, MEDIUM severities (LOW excluded)
- **Includes**: Guard info, location, shift details
- **Restricted**: Supervisors and above

**Usage:**
```typescript
import { getUnreviewedIncidents } from '@/app/actions'

const result = await getUnreviewedIncidents()

if (result.success) {
  result.incidents.forEach(incident => {
    console.log(`[${incident.severity}] ${incident.title}`)
  })
}
```

#### `reviewIncident(data)`
- **Description**: Add supervisor review to an incident
- **Required**: Review notes (minimum 1 character)
- **Sets**: `reviewedBy`, `reviewedAt`, `reviewNotes` fields
- **Validates**: Incident hasn't been reviewed already
- **Revalidates**: `/admin/dashboard`, `/logs`

**Usage:**
```typescript
import { reviewIncident } from '@/app/actions'

const result = await reviewIncident({
  incidentId: 'clx111...',
  reviewNotes: 'Investigated and resolved. Added extra patrols.'
})
```

#### `getIncidentsByStatus(status)`
- **Description**: Filter incidents by status for dashboard tabs
- **Statuses**: `'all'`, `'unreviewed'`, `'live'`, `'updated'`, `'archived'`
- **Used**: Dashboard incident tabs

---

## 📍 4. Location Check-Ins (`location-checkins.ts`)

**Purpose**: Track supervisor rounds across multiple marina locations

### Actions:

#### `checkInToLocation(data)`
- **Description**: Supervisor checks in during roaming duty
- **Validates**:
  - User is supervisor or above
  - User has active duty session
  - Location exists and is active
- **Creates**: Timestamped check-in record linked to duty session
- **Revalidates**: `/admin/dashboard`, `/dashboard`

**Usage:**
```typescript
import { checkInToLocation } from '@/app/actions'

const result = await checkInToLocation({
  locationId: 'clx222...',
  notes: 'All clear, boat slips secure'
})

if (result.success) {
  console.log(result.message) // "Checked in to East Bay Marina"
}
```

#### `getLocationCheckIns(filters?)`
- **Description**: Get check-in history with optional filters
- **Filters**: `dutySessionId`, `locationId`
- **Permissions**:
  - Guards see only their own
  - Supervisors see all
- **Sorted**: By check-in time (newest first)

**Usage:**
```typescript
import { getLocationCheckIns } from '@/app/actions'

const result = await getLocationCheckIns({
  locationId: 'clx333...'  // Optional filter
})
```

#### `getMyRecentCheckIns(limit?)`
- **Description**: Get recent check-ins for current user's active session
- **Default limit**: 5
- **Returns**: Empty array if no active duty session
- **Used**: Dashboard "Recent Check-ins" widget

---

## 🔔 5. Notifications (`notifications.ts`)

**Purpose**: System-wide alerts and notifications (placeholder for future implementation)

### Actions:

#### `getNotifications()`
- **Description**: Get notifications for current user
- **Current**: Returns empty array (placeholder)
- **TODO**: Implement with Notification database table

#### `dismissNotification(notificationId)`
- **Description**: Mark notification as read/dismissed
- **Current**: Placeholder implementation
- **TODO**: Update database when implemented

#### `createSystemNotification(data)`
- **Description**: Create system-wide or user-specific notification
- **Restricted**: Admins only (when implemented)
- **TODO**: Implement with real-time delivery (WebSockets/SSE)

**Future Structure:**
```typescript
// When implemented with database table
interface Notification {
  id: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  createdAt: Date
  read: boolean
  userId?: string  // Optional - null for broadcast
}
```

---

## 🔐 Security & Authorization

All Server Actions implement:

### 1. **Authentication Check**
```typescript
const { userId } = await auth()  // Clerk authentication
if (!userId) {
  return { success: false, error: 'Unauthorized' }
}
```

### 2. **User Lookup**
```typescript
const user = await prisma.user.findUnique({
  where: { clerkId: userId }
})
```

### 3. **Role-Based Authorization**
```typescript
if (!canManageShifts(user.role)) {
  return { success: false, error: 'Insufficient permissions' }
}
```

### 4. **Input Validation with Zod**
```typescript
const validatedData = schema.parse(data)  // Throws on invalid input
```

### 5. **Ownership Verification**
```typescript
if (dutySession.userId !== user.id) {
  return { success: false, error: 'Unauthorized to modify this session' }
}
```

---

## 🔄 Revalidation Strategy

Server Actions use `revalidatePath()` to automatically update cached data:

```typescript
import { revalidatePath } from 'next/cache'

// After mutation
revalidatePath('/dashboard')          // Revalidate dashboard
revalidatePath('/admin/dashboard')    // Revalidate admin dashboard
revalidatePath('/logs')               // Revalidate logs page
```

This ensures the UI updates immediately after data changes without manual cache invalidation.

---

## 📝 Return Value Pattern

All Server Actions follow a consistent return pattern:

### Success Response:
```typescript
{
  success: true,
  data: {...},           // The created/updated data
  message?: string       // Optional success message
}
```

### Error Response:
```typescript
{
  success: false,
  error: string,         // Human-readable error message
  issues?: ZodIssue[]    // Optional validation errors (Zod)
}
```

This makes error handling consistent across the application:

```typescript
const result = await someAction(data)

if (result.success) {
  toast.success(result.message || 'Operation successful')
  // Use result.data
} else {
  toast.error(result.error)
  // Handle result.issues if validation errors
}
```

---

## 🎯 Usage Examples

### From Client Components:
```typescript
'use client'

import { clockIn } from '@/app/actions'
import { toast } from 'sonner'

export function ClockInButton({ locationId }: { locationId: string }) {
  const handleClockIn = async () => {
    const result = await clockIn({ locationId })

    if (result.success) {
      toast.success('Successfully clocked in!')
    } else {
      toast.error(result.error)
    }
  }

  return <button onClick={handleClockIn}>Clock In</button>
}
```

### With Forms (Progressive Enhancement):
```typescript
'use client'

import { clockIn } from '@/app/actions'
import { useActionState } from 'react'

export function ClockInForm() {
  const [state, formAction, pending] = useActionState(
    async (_prevState: any, formData: FormData) => {
      const result = await clockIn({
        locationId: formData.get('locationId') as string
      })
      return result
    },
    null
  )

  return (
    <form action={formAction}>
      <select name="locationId" required>
        {/* location options */}
      </select>
      <button type="submit" disabled={pending}>
        {pending ? 'Clocking in...' : 'Clock In'}
      </button>
      {state?.error && <p>{state.error}</p>}
    </form>
  )
}
```

### With Optimistic Updates:
```typescript
'use client'

import { reviewIncident } from '@/app/actions'
import { useOptimistic } from 'react'

export function IncidentList({ incidents }) {
  const [optimisticIncidents, addOptimisticReview] = useOptimistic(
    incidents,
    (state, reviewedId: string) =>
      state.filter(inc => inc.id !== reviewedId)
  )

  const handleReview = async (incidentId: string, notes: string) => {
    addOptimisticReview(incidentId)  // Update UI immediately

    const result = await reviewIncident({ incidentId, reviewNotes: notes })
    // UI already updated optimistically
  }

  return (
    <ul>
      {optimisticIncidents.map(incident => (
        <IncidentCard key={incident.id} incident={incident} onReview={handleReview} />
      ))}
    </ul>
  )
}
```

---

## 🚀 Why Server Actions Over API Routes?

### Before (API Routes - Old Pattern):
```typescript
// app/api/duty-sessions/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  // ... validation, auth, mutation
  return NextResponse.json({ dutySession })
}

// Client usage:
const response = await fetch('/api/duty-sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
const result = await response.json()
```

### After (Server Actions - New Pattern):
```typescript
// app/actions/duty-sessions.ts
'use server'

export async function clockIn(data) {
  // ... validation, auth, mutation
  return { success: true, dutySession }
}

// Client usage (much simpler):
import { clockIn } from '@/app/actions'
const result = await clockIn(data)
```

**Benefits:**
- ✅ Less boilerplate
- ✅ Type-safe (no JSON serialization)
- ✅ No manual route definition
- ✅ Built-in revalidation
- ✅ Works with React 19 features
- ✅ Progressive enhancement

---

## 🔧 Migration Notes

### Old API Routes Still Present

The original API routes in `app/api/` are **still present but deprecated**. They can be:
1. **Removed** once all client code is updated to use Server Actions
2. **Kept** if you need external webhooks or REST API access
3. **Converted** to thin wrappers around Server Actions if needed

**Recommendation**: Remove API routes that are only used internally. Keep only those needed for external integrations.

---

## 📖 Further Reading

- [Next.js Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React 19 Actions](https://react.dev/reference/react/useActionState)
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)

---

## Summary

Server Actions provide a **modern, type-safe, and efficient** way to handle data mutations in Next.js 16. They replace the older API Routes pattern for internal operations while maintaining full TypeScript support and React 19 integration.

**All business logic for the marina guard management system is now handled through Server Actions**, providing:
- 🔒 Secure server-side execution
- 📝 Type-safe function calls
- ⚡ Automatic cache revalidation
- 🎯 Better developer experience
- 🚀 Progressive enhancement support
