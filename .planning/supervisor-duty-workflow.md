# Supervisor Duty Workflow - Implementation Plan

## Overview
Create a supervisor-specific duty check-in/check-out workflow that differs from the guard workflow. Supervisors will always start at HQ location, check out equipment (car with mileage + radio with number), and return equipment when going off duty.

## Requirements

### 1. HQ Location
- Add new "HQ" location to the database
- This is the mandatory starting location for all supervisors
- Supervisors cannot choose a different location

### 2. Supervisor Check-In Process
At the START of duty, supervisors must:
1. Clock in at HQ location (automatic, no choice)
2. Check out a car (record mileage)
3. Check out a radio (record radio number)
4. Both equipment checkouts are logged at HQ

### 3. Supervisor Check-Out Process
At the END of duty, supervisors must:
1. Return car (record ending mileage)
2. Return radio
3. Clock out from HQ
4. All returns are logged at HQ

### 4. Dual Workflow System
- **Guards**: Use existing safety checklist workflow (equipment verification)
- **Supervisors**: Use new equipment checkout/return workflow (car + radio)
- Role-based form display

## Database Schema Changes

### New Tables

#### 1. `SupervisorEquipment` - Track available equipment
```prisma
model SupervisorEquipment {
  id          String              @id @default(cuid())
  type        SupervisorEquipmentType // CAR, RADIO
  identifier  String              // License plate, Radio number
  isAvailable Boolean             @default(true)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  checkouts   SupervisorEquipmentCheckout[]

  @@unique([type, identifier])
  @@index([type])
  @@index([isAvailable])
}

enum SupervisorEquipmentType {
  CAR
  RADIO
}
```

#### 2. `SupervisorEquipmentCheckout` - Track equipment usage
```prisma
model SupervisorEquipmentCheckout {
  id            String   @id @default(cuid())
  dutySessionId String
  equipmentId   String

  // Car-specific fields
  checkoutMileage Int?
  checkinMileage  Int?

  // Radio-specific (identifier already in equipment)

  checkoutTime DateTime @default(now())
  checkinTime  DateTime?
  notes        String?  @db.Text

  dutySession  DutySession         @relation(fields: [dutySessionId], references: [id], onDelete: Cascade)
  equipment    SupervisorEquipment @relation(fields: [equipmentId], references: [id])

  @@index([dutySessionId])
  @@index([equipmentId])
  @@index([checkoutTime])
}
```

### Schema Modifications

#### Update `DutySession` model
Add relationship to equipment checkouts:
```prisma
model DutySession {
  // ... existing fields
  equipmentCheckouts SupervisorEquipmentCheckout[]
}
```

## Implementation Steps

### Phase 1: Database Setup

**Files to modify:**
- `prisma/schema.prisma` - Add new models and enums
- Migration: `npx prisma migrate dev --name add_supervisor_equipment_workflow`

### Phase 2: Server Actions

**New file:** `lib/actions/supervisor-equipment-actions.ts`

Functions needed:
```typescript
// Equipment Management
export async function getAvailableEquipment(type: 'CAR' | 'RADIO'): Promise<ActionResult<SupervisorEquipment[]>>
export async function createEquipment(type: 'CAR' | 'RADIO', identifier: string): Promise<ActionResult<SupervisorEquipment>>

// Checkout/Checkin Operations
export async function checkoutEquipment(data: {
  dutySessionId: string
  carId: string
  radioId: string
  checkoutMileage: number
  radioNumber: string
}): Promise<ActionResult<SupervisorEquipmentCheckout[]>>

export async function checkinEquipment(data: {
  dutySessionId: string
  checkinMileage: number
  notes?: string
}): Promise<ActionResult<SupervisorEquipmentCheckout[]>>

export async function getEquipmentCheckouts(dutySessionId: string): Promise<ActionResult<SupervisorEquipmentCheckout[]>>
```

**Modify:** `lib/actions/duty-session-actions.ts`
- Update `clockIn` to handle supervisor HQ location assignment
- Update `clockOut` to ensure equipment is returned

**Modify:** `lib/actions/location-actions.ts`
- Add function to get HQ location specifically

### Phase 3: TypeScript Types

**Modify:** `lib/types/prisma-types.ts`

Add new types:
```typescript
export type SupervisorEquipmentWithCheckouts = Prisma.SupervisorEquipmentGetPayload<{
  include: {
    checkouts: {
      include: {
        dutySession: {
          include: {
            user: {
              select: {
                firstName: true
                lastName: true
              }
            }
          }
        }
      }
    }
  }
}>

export type SupervisorEquipmentCheckoutWithDetails = Prisma.SupervisorEquipmentCheckoutGetPayload<{
  include: {
    equipment: true
    dutySession: {
      include: {
        user: {
          select: {
            firstName: true
            lastName: true
          }
        }
      }
    }
  }
}>

export type DutySessionWithEquipment = Prisma.DutySessionGetPayload<{
  include: {
    location: true
    shift: true
    equipmentCheckouts: {
      include: {
        equipment: true
      }
    }
  }
}>
```

**Modify:** `lib/types.ts`
Add enum:
```typescript
export type SupervisorEquipmentType = "CAR" | "RADIO"
```

### Phase 4: UI Components

#### New Components

**File:** `components/duty/supervisor-clock-in-dialog.tsx`
- Form with car selection dropdown (available cars)
- Mileage input field (number)
- Radio selection dropdown (available radios)
- Both required fields
- Submit creates duty session + equipment checkouts

**File:** `components/duty/supervisor-clock-out-dialog.tsx`
- Display checked-out car info (license plate, starting mileage)
- Input field for ending mileage
- Display checked-out radio info
- Optional notes field
- Submit records check-in mileage + returns equipment

**File:** `components/duty/supervisor-equipment-status-card.tsx`
- Display currently checked-out equipment
- Show car: license plate, start mileage, hours in use
- Show radio: radio number
- Quick access to clock out

#### Modified Components

**File:** `components/duty/clock-in-dialog.tsx`
- **Current**: Handles both guards and supervisors
- **Change**: Only handle guards (remove supervisor logic)
- Reason: Supervisors will use dedicated `supervisor-clock-in-dialog.tsx`

**File:** `components/duty/duty-status-card.tsx`
- Add conditional rendering:
  - Guards: Show current code
  - Supervisors: Show `supervisor-equipment-status-card.tsx`

### Phase 5: Admin Dashboard Integration

**Modify:** `app/(admin)/dashboard/page.tsx`

Changes needed:
1. Import supervisor-specific dialogs
2. Add state for equipment data
3. Fetch available equipment on load
4. Conditional dialog rendering based on role:
   ```typescript
   {isSupervisor ? (
     <SupervisorClockInDialog ... />
   ) : (
     <ClockInDialog ... />
   )}
   ```
5. Handle equipment checkout/checkin in clock in/out handlers

### Phase 6: Equipment Management Page (Admin)

**New file:** `app/(admin)/dashboard/equipment/page.tsx`

Features:
- List all equipment (cars and radios)
- Add new equipment (car with license plate, radio with number)
- View equipment status (available, checked out, who has it)
- View equipment history
- Edit/deactivate equipment

**New file:** `components/equipment/equipment-management-table.tsx`
- Table showing all equipment
- Columns: Type, Identifier, Status, Current User, Actions
- Actions: View History, Edit, Deactivate

**New file:** `components/equipment/add-equipment-dialog.tsx`
- Form to add new car or radio
- Type selection
- Identifier input

### Phase 7: HQ Location Setup

**Option 1: Migration Seed**
Add to migration file:
```sql
INSERT INTO "Location" (id, name, description, address, "isActive", "maxCapacity")
VALUES ('hq_location_id', 'HQ - Headquarters', 'Supervisor starting location', 'Town of Islip Marina Office', true, NULL)
ON CONFLICT (name) DO NOTHING;
```

**Option 2: Seed Script**
Update `prisma/seed.ts` to include HQ location if it doesn't exist.

## Validation Rules

### Clock-In Validation (Supervisors)
- ✅ Must select a car (from available cars)
- ✅ Must enter valid mileage (number > 0)
- ✅ Must select a radio (from available radios)
- ✅ Car must be available (not checked out by another supervisor)
- ✅ Radio must be available (not checked out by another supervisor)
- ✅ Automatically set location to HQ (no user selection)

### Clock-Out Validation (Supervisors)
- ✅ Must enter ending mileage
- ✅ Ending mileage must be >= starting mileage
- ✅ Must have active duty session with equipment checked out
- ✅ Equipment automatically marked as available after return

## UI/UX Flow

### Supervisor Clock-In Flow
1. Supervisor clicks "Report for Duty" on dashboard
2. System opens `SupervisorClockInDialog`
3. System displays available cars and radios
4. Supervisor selects car, enters mileage
5. Supervisor selects radio
6. Supervisor clicks "Clock In"
7. System creates:
   - DutySession (locationId = HQ, userId = supervisor)
   - SupervisorEquipmentCheckout for car (with mileage)
   - SupervisorEquipmentCheckout for radio
8. System marks equipment as unavailable
9. Dashboard shows supervisor on duty at HQ with equipment info

### Supervisor Clock-Out Flow
1. Supervisor clicks "Sign Off Duty" on dashboard
2. System opens `SupervisorClockOutDialog`
3. Dialog shows:
   - Car checked out: [License Plate]
   - Starting mileage: [X miles]
   - Radio checked out: [Radio #]
4. Supervisor enters ending mileage
5. Supervisor optionally adds notes
6. Supervisor clicks "Clock Out"
7. System updates:
   - SupervisorEquipmentCheckout records (add checkinTime, checkinMileage)
   - DutySession (add clockOutTime)
8. System marks equipment as available
9. Dashboard shows supervisor off duty

## File Structure

```
prisma/
  ├── schema.prisma (MODIFY - add SupervisorEquipment models)
  └── migrations/
      └── YYYYMMDDHHMMSS_add_supervisor_equipment_workflow/

lib/
  ├── actions/
  │   ├── supervisor-equipment-actions.ts (NEW)
  │   ├── duty-session-actions.ts (MODIFY)
  │   └── location-actions.ts (MODIFY - add getHQLocation)
  ├── types/
  │   └── prisma-types.ts (MODIFY - add equipment types)
  ├── types.ts (MODIFY - add enum)
  └── validations/
      └── supervisor-equipment.ts (NEW - Zod schemas)

components/
  ├── duty/
  │   ├── supervisor-clock-in-dialog.tsx (NEW)
  │   ├── supervisor-clock-out-dialog.tsx (NEW)
  │   ├── supervisor-equipment-status-card.tsx (NEW)
  │   ├── clock-in-dialog.tsx (MODIFY - guards only)
  │   └── duty-status-card.tsx (MODIFY - conditional rendering)
  └── equipment/
      ├── equipment-management-table.tsx (NEW)
      ├── add-equipment-dialog.tsx (NEW)
      └── equipment-history-dialog.tsx (NEW)

app/
  └── (admin)/
      └── dashboard/
          ├── page.tsx (MODIFY - supervisor workflow)
          └── equipment/
              └── page.tsx (NEW - equipment management)
```

## Testing Checklist

### Database
- [ ] Migration runs successfully
- [ ] HQ location is created
- [ ] Sample cars and radios seeded

### Supervisor Clock-In
- [ ] Can select available car
- [ ] Can enter mileage (validates number)
- [ ] Can select available radio
- [ ] Location automatically set to HQ
- [ ] Equipment marked as unavailable after checkout
- [ ] Duty session created with HQ location

### Supervisor Clock-Out
- [ ] Shows correct equipment info
- [ ] Validates ending mileage >= starting mileage
- [ ] Marks equipment as available
- [ ] Closes duty session

### Guards (Regression)
- [ ] Guards still see safety checklist
- [ ] Guards can select their location
- [ ] Guard workflow unchanged

### Equipment Management
- [ ] Can add new car
- [ ] Can add new radio
- [ ] Can view equipment status
- [ ] Can see who has equipment

## Risk Mitigation

### Concurrency Issues
**Risk**: Two supervisors try to check out the same car simultaneously
**Solution**: Use database transactions with row locking

### Missing Equipment Return
**Risk**: Supervisor forgets to clock out, equipment stuck as "checked out"
**Solution**:
- Admin override function to force return equipment
- Report showing equipment checked out > 24 hours

### Data Integrity
**Risk**: Duty session exists without equipment checkout
**Solution**: Database constraints + validation in server actions

## Future Enhancements (Out of Scope)

- Equipment maintenance tracking
- Mileage reports (total miles driven per car)
- Radio issue reporting
- Equipment reservation system
- Damage/incident reporting for equipment
- Equipment checkout history export
