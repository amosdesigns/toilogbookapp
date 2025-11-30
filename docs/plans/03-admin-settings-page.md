# Admin Settings Page Implementation Plan

## Overview

Implement a comprehensive settings page for admins to manage system configurations. The page will have two main sections:
1. **Safety Checklist Management** - Manage guard check-in questions/items
2. **Location Settings** - Manage marina locations and their max guard capacity

## Requirements Summary

Based on user responses:
- **Two sections**: Safety checklist items + Location management (max guards, CRUD)
- **Checklist actions**: Add new items, Edit items, Delete items (soft delete)
- **Checklist scope**: Global (same for all locations)
- **Default items**: System-provided templates that can be enabled
- **Access**: ADMIN role and higher only

## Current System Analysis

### What Already Exists

**SafetyChecklist Models** (Prisma schema):
- `SafetyChecklistItem` - Master list of checklist questions
  - Fields: id, name, description, order, isActive, timestamps
- `SafetyChecklistResponse` - Completed checklists by guards
- `SafetyChecklistItemCheck` - Individual item responses

**Location Model** (Prisma schema):
- Fields: id, name, description, address, isActive, `maxCapacity`, timestamps
- `maxCapacity`: Already exists! "Maximum number of guards that can be assigned per shift"

**Server Actions**:
- `getSafetyChecklistItems()` - Get active items
- `submitSafetyChecklist(data)` - Save completed checklist
- `getLocations()` - Get all locations
- Basic location CRUD exists in `location-actions.ts`

**Guard-Side UI**:
- `ClockInDialog` - Guards complete checklist during clock-in
- `SafetyChecklistDialog` - Standalone checklist completion

**Settings Page**:
- Currently placeholder at `app/(admin)/dashboard/settings/page.tsx`

### What's Missing

**For Safety Checklist Management**:
- Admin UI to view all checklist items
- Create/Edit/Delete actions for checklist items
- Server actions for CRUD operations
- Validation schemas
- Default/template items to enable
- Drag-and-drop reordering UI

**For Location Settings**:
- Admin UI to manage locations table
- Edit maxCapacity field
- Create/update/delete location actions (may partially exist)
- Validation for location data

**General**:
- Settings page structure with tabs/sections
- Permission checks (ADMIN+)

## Database Schema - No Changes Needed!

The schema already supports everything we need:

**SafetyChecklistItem** (existing):
```prisma
model SafetyChecklistItem {
  id              String    @id @default(cuid())
  name            String
  description     String?
  order           Int
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

**Location** (existing):
```prisma
model Location {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  address     String?
  isActive    Boolean  @default(true)
  maxCapacity Int?     // Maximum number of guards per shift
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**No migration needed!** All database infrastructure exists.

## Implementation Phases

See full implementation details in the plan file.

### Critical Files Summary

**New Files (~15 total)**:
1. Server actions for checklist management
2. Default template constants
3. Validation schemas
4. Settings page components
5. Safety checklist UI components
6. Location settings UI components

**Estimated Time**: 6-9 hours
