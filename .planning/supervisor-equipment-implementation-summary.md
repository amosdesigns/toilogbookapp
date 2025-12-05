# Supervisor Equipment Workflow - Implementation Summary

## Overview
Implemented a complete supervisor equipment checkout/check-in workflow that allows supervisors to check out cars and radios when starting duty, and return them when signing off.

## What Was Implemented

### 1. Database Schema Changes
**New Models:**
- `SupervisorEquipment` - Tracks cars and radios available at HQ
  - Fields: id, type (CAR/RADIO), identifier, isAvailable, timestamps
  - Unique constraint on (type, identifier)

- `SupervisorEquipmentCheckout` - Tracks equipment checkout/check-in records
  - Fields: id, dutySessionId, equipmentId, checkoutTime, checkinTime, checkoutMileage, checkinMileage, notes, timestamps
  - Links to DutySession and SupervisorEquipment

### 2. Server Actions
**File:** `lib/actions/supervisor-equipment-actions.ts`

**Actions Created:**
- `getAvailableEquipment(type)` - Get available cars or radios
- `getAllEquipment()` - Get all equipment (admin only)
- `createEquipment(type, identifier)` - Create new equipment (admin only)
- `checkoutEquipment(data)` - Checkout car + radio atomically
- `checkinEquipment(data)` - Return car + radio, record mileage
- `getEquipmentCheckouts(dutySessionId)` - Get checkouts for a session
- `getHQLocation()` - Get HQ location details

**Key Features:**
- Atomic transactions ensure both car and radio are checked out together
- Validation ensures checkout mileage < checkin mileage
- Equipment automatically marked unavailable/available
- All actions use Result<T> type pattern

### 3. UI Components

#### SupervisorClockInDialog
**File:** `components/duty/supervisor-clock-in-dialog.tsx`
- Three-step questionnaire format:
  1. "What car number?" - Dropdown of available cars
  2. "What is the mileage of that car?" - Number input
  3. "Which radio are you using?" - Dropdown of available radios
- Fetches available equipment on dialog open
- Validates all fields before submission
- Shows loading states during equipment fetch

#### SupervisorClockOutDialog
**File:** `components/duty/supervisor-clock-out-dialog.tsx`
- Three-step return process:
  1. "Returning Car: [identifier]" - Shows starting mileage
  2. "What is the mileage?" - Number input with validation
  3. "Returning Radio: [identifier]" - Confirmation
- Calculates miles driven in real-time
- Validates ending mileage > starting mileage
- Shows validation errors inline

#### SupervisorEquipmentStatusCard
**File:** `components/duty/supervisor-equipment-status-card.tsx`
- Shows current equipment checked out
- Displays car number and mileage
- Displays radio number
- Shows time on duty
- "Sign Off Duty" button triggers clock out dialog

### 4. Dashboard Integration
**File:** `app/(admin)/dashboard/page.tsx`

**Changes:**
- Added supervisor-specific conditional rendering
- Shows `SupervisorEquipmentStatusCard` when equipment is checked out
- Falls back to `DutyStatusCard` when not on duty
- Clock in button opens `SupervisorClockInDialog` for supervisors
- Clock out with equipment triggers `SupervisorClockOutDialog`
- State management for equipment checkouts

**Workflow:**
1. Supervisor clicks "Headquarters Check-In Only"
2. SupervisorClockInDialog opens with 3 questions
3. Creates duty session at HQ location
4. Checks out selected car and radio
5. Dashboard shows equipment status card
6. Supervisor can perform location check-ins during rounds
7. Supervisor clicks "Sign Off Duty"
8. SupervisorClockOutDialog opens to return equipment
9. Records ending mileage and marks equipment available

### 5. Setup Script
**File:** `scripts/setup-supervisor-equipment.ts`

**Purpose:** Initialize supervisor equipment in database
- Creates HQ location if doesn't exist
- Creates 3 sample cars (TOI-001, TOI-002, TOI-003)
- Creates 5 sample radios (Radio-1 through Radio-5)
- Idempotent - can run multiple times safely

**Run with:** `npx tsx scripts/setup-supervisor-equipment.ts`

### 6. Validation Schemas
**File:** `lib/validations/supervisor-equipment.ts`

**Schemas:**
- `supervisorClockInSchema` - Validates car, radio, mileage on clock in
- `supervisorClockOutSchema` - Validates mileage on clock out

## Testing Instructions

### Prerequisites
1. Ensure database is migrated: `npx prisma migrate dev`
2. Run setup script: `npx tsx scripts/setup-supervisor-equipment.ts`
3. Start dev server: `npm run dev`
4. Sign in with a SUPERVISOR, ADMIN, or SUPER_ADMIN account

### Test Scenario 1: Happy Path
1. Go to `/admin/dashboard`
2. Click "Headquarters Check-In Only" button
3. In dialog:
   - Select a car (e.g., "TOI-001")
   - Enter mileage (e.g., "50000")
   - Select a radio (e.g., "Radio-1")
4. Click "Check In for Duty"
5. Verify:
   - Toast shows "Successfully clocked in and checked out equipment!"
   - Dashboard shows equipment status card with car and radio info
   - Time on duty is counting
6. Click "Sign Off Duty"
7. In dialog:
   - Note starting mileage displayed
   - Enter ending mileage greater than start (e.g., "50050")
   - See "Miles driven: 50 miles" calculation
8. Click "Sign Off Duty"
9. Verify:
   - Toast shows success
   - Dashboard returns to "not on duty" state
   - Can clock in again with same equipment

### Test Scenario 2: Mileage Validation
1. Clock in with a car at mileage 50000
2. Clock out and try to enter mileage 49000 (less than start)
3. Verify:
   - Form shows error: "Ending mileage must be greater than starting mileage"
   - Submit button is disabled
   - Miles driven shows negative in red

### Test Scenario 3: Equipment Availability
1. Clock in as Supervisor A with TOI-001 and Radio-1
2. In another browser/incognito as Supervisor B
3. Try to clock in
4. Verify:
   - TOI-001 and Radio-1 are not in the dropdown
   - Only available equipment shows
5. Clock out as Supervisor A
6. Refresh Supervisor B's dialog
7. Verify TOI-001 and Radio-1 are now available

### Test Scenario 4: No Equipment Available
1. Have 3 supervisors clock in (use all equipment)
2. Try to clock in as 4th supervisor
3. Verify:
   - Dialog shows "No cars available" or "No radios available"
   - Submit button is disabled
   - Form cannot be submitted

## Database Queries for Verification

```sql
-- Check available equipment
SELECT * FROM "SupervisorEquipment" ORDER BY "type", "identifier";

-- Check active checkouts
SELECT
  sec.*,
  se.type,
  se.identifier,
  ds."userId",
  u."firstName",
  u."lastName"
FROM "SupervisorEquipmentCheckout" sec
JOIN "SupervisorEquipment" se ON sec."equipmentId" = se.id
JOIN "DutySession" ds ON sec."dutySessionId" = ds.id
JOIN "User" u ON ds."userId" = u.id
WHERE sec."checkinTime" IS NULL;

-- Check mileage records for a car
SELECT
  sec."checkoutTime",
  sec."checkinTime",
  sec."checkoutMileage",
  sec."checkinMileage",
  (sec."checkinMileage" - sec."checkoutMileage") as "milesDriven",
  u."firstName" || ' ' || u."lastName" as "supervisor"
FROM "SupervisorEquipmentCheckout" sec
JOIN "SupervisorEquipment" se ON sec."equipmentId" = se.id
JOIN "DutySession" ds ON sec."dutySessionId" = ds.id
JOIN "User" u ON ds."userId" = u.id
WHERE se."identifier" = 'TOI-001'
ORDER BY sec."checkoutTime" DESC;
```

## Current System State
- HQ Location: ✅ Created (ID: hq_location_001)
- Cars: ✅ 3 available (TOI-001, TOI-002, TOI-003)
- Radios: ✅ 5 available (Radio-1 through Radio-5)
- Your account (mail@amosdesigns.net): ✅ SUPERVISOR role

## Known Limitations
1. Equipment can only be checked out at HQ (by design)
2. All supervisors share same equipment pool (first-come, first-served)
3. No reservation system - equipment assigned when clocking in
4. Mileage must be manually entered (no GPS integration)

## Future Enhancements (Not Implemented)
- Equipment reservation system
- Maintenance tracking per vehicle
- Fuel level tracking
- GPS integration for automatic mileage
- Equipment usage reports and analytics
- Admin UI for managing equipment
- Email notifications for low equipment availability

## Files Modified/Created

### New Files
- `lib/actions/supervisor-equipment-actions.ts`
- `components/duty/supervisor-clock-in-dialog.tsx`
- `components/duty/supervisor-clock-out-dialog.tsx`
- `components/duty/supervisor-equipment-status-card.tsx`
- `lib/validations/supervisor-equipment.ts`
- `scripts/setup-supervisor-equipment.ts`
- `prisma/migrations/[timestamp]_add_supervisor_equipment_workflow/`

### Modified Files
- `app/(admin)/dashboard/page.tsx` - Added supervisor workflow integration
- `components/duty/duty-status-card.tsx` - Updated button text
- `prisma/schema.prisma` - Added new models

## Ready to Test!
The feature is fully implemented and ready for testing. Follow the test scenarios above to verify functionality.
