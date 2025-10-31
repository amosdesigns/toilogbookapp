# Shift Calendar Components

A comprehensive shift calendar system for managing and displaying guard shifts across multiple marina locations.

## Components

### ShiftCalendar

The main calendar component that displays shifts in multiple views (month, week, day, agenda).

**Features:**
- Multiple calendar views (month, week, day, agenda)
- Filter by location and supervisor
- Color-coded by location
- Click on shifts to view details
- Role-based permissions (guards can view, supervisors+ can manage)
- Responsive design with dark mode support

### ShiftCalendarControls

Navigation and filter controls for the calendar.

**Features:**
- Date navigation (previous, next, today)
- Calendar view selector
- Multi-select location filters
- Multi-select supervisor filters
- Active filter badges
- Create shift button (for supervisors+)

### ShiftCard

Displays detailed information about a shift.

**Features:**
- Shift name and location
- Start and end times
- Supervisor information
- Location address
- Edit/delete actions (for supervisors+)

## Usage Example

```tsx
"use client"

import { ShiftCalendar } from "@/components/shift"
import { useState } from "react"

export default function ShiftsPage() {
  const [shifts, setShifts] = useState([])
  const [locations, setLocations] = useState([])
  const [supervisors, setSupervisors] = useState([])

  // Fetch data on mount
  useEffect(() => {
    // Fetch shifts, locations, and supervisors from your API
    fetchShifts().then(setShifts)
    fetchLocations().then(setLocations)
    fetchSupervisors().then(setSupervisors)
  }, [])

  const handleCreateShift = () => {
    // Open create shift dialog/modal
    console.log("Create shift")
  }

  const handleEditShift = (shift) => {
    // Open edit shift dialog/modal with shift data
    console.log("Edit shift:", shift)
  }

  const handleDeleteShift = async (shiftId) => {
    // Delete shift with confirmation
    if (confirm("Are you sure you want to delete this shift?")) {
      await deleteShift(shiftId)
      // Refresh shifts
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Shift Calendar</h1>

      <ShiftCalendar
        shifts={shifts}
        locations={locations}
        supervisors={supervisors}
        userRole="SUPERVISOR"
        userId="current-user-id"
        onCreateShift={handleCreateShift}
        onEditShift={handleEditShift}
        onDeleteShift={handleDeleteShift}
      />
    </div>
  )
}
```

## Data Structure

### ShiftWithDetails

```typescript
interface ShiftWithDetails extends Shift {
  location: Location
  supervisor: User | null
}
```

### Example Data

```typescript
const exampleShift: ShiftWithDetails = {
  id: "shift-123",
  name: "Morning Patrol",
  startTime: new Date("2025-10-29T08:00:00"),
  endTime: new Date("2025-10-29T16:00:00"),
  locationId: "loc-1",
  supervisorId: "user-1",
  location: {
    id: "loc-1",
    name: "Sloop Marina",
    description: "Main marina location",
    address: "123 Marina Dr, Islip, NY",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  supervisor: {
    id: "user-1",
    clerkId: "clerk-123",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "SUPERVISOR",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}
```

## API Integration

### Fetching Shifts

```typescript
// app/api/shifts/route.ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const shifts = await prisma.shift.findMany({
    include: {
      location: true,
      supervisor: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  })

  return NextResponse.json(shifts)
}
```

### Creating a Shift

```typescript
// app/api/shifts/route.ts
import { prisma } from "@/lib/prisma"
import { createShiftSchema } from "@/lib/validations"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const json = await request.json()
  const body = createShiftSchema.parse(json)

  const shift = await prisma.shift.create({
    data: body,
    include: {
      location: true,
      supervisor: true,
    },
  })

  return NextResponse.json(shift)
}
```

## Permissions

The calendar respects role-based permissions:

| Action | Guard | Supervisor | Admin | Super Admin |
|--------|-------|------------|-------|-------------|
| View calendar | ✅ | ✅ | ✅ | ✅ |
| Filter calendar | ✅ | ✅ | ✅ | ✅ |
| View shift details | ✅ | ✅ | ✅ | ✅ |
| Create shift | ❌ | ✅ | ✅ | ✅ |
| Edit shift | ❌ | ✅ | ✅ | ✅ |
| Delete shift | ❌ | ✅ | ✅ | ✅ |

## Customization

### Color Coding

By default, shifts are color-coded by location. You can customize the colors in the `eventStyleGetter` function in `ShiftCalendar`:

```typescript
const eventStyleGetter = useCallback((event: ShiftCalendarEvent) => {
  // Your custom color logic here
  const backgroundColor = getColorForShift(event.resource)

  return {
    style: {
      backgroundColor,
      // ... other styles
    },
  }
}, [])
```

### Calendar Views

The calendar supports four views:
- **Month**: Monthly overview of all shifts
- **Week**: Week view with time slots
- **Day**: Single day with detailed time slots
- **Agenda**: List view of upcoming shifts

## Styling

The calendar uses custom CSS that integrates with your design system and supports dark mode. The styles are defined in `app/globals.css`.

To further customize the appearance, modify the CSS classes prefixed with `.rbc-` (React Big Calendar classes).

## Dependencies

- `react-big-calendar` - Calendar component library
- `date-fns` - Date manipulation and formatting
- shadcn/ui components (Dialog, Button, Select, etc.)
- Lucide React icons

## Notes

- Shifts spanning multiple days are supported
- The calendar automatically adjusts to the user's timezone
- Filters persist during navigation
- The calendar is fully responsive and works on mobile devices
