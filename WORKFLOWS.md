# User Workflows

Complete guide to how different user roles interact with the Marina Guard Logbook system.

## 🔐 Sign-In & Routing

### On Sign-In, users are routed based on their role:

```typescript
// Automatic routing after Clerk authentication

if (role === "SUPER_ADMIN" || role === "ADMIN") {
  → /admin/dashboard
}
else if (role === "SUPERVISOR") {
  → /supervisor/home  (with incident alerts)
}
else if (role === "GUARD") {
  → /  (public mobile interface)
}
```

---

## 👮 GUARD Workflow (Mobile-First)

**Interface**: Mobile-optimized with bottom navigation
**Duty Type**: Single location at a time

### Landing Page (`/`)

```
┌─────────────────────────────────────┐
│  Marina Guard                       │
│  Welcome, John!                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  📍 Current Status                  │
│  ● On Duty at Sloop Marina         │
│  ⏱ Started: 8:00 AM (2h 15m ago)   │
│  [Sign Off Duty]                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Quick Actions                      │
│  🚨 Report Incident                 │
│  📋 Check Logbook                   │
│  📅 My Schedule                     │
└─────────────────────────────────────┘
```

### 1. Report for Duty

**Flow:**
```
Home → [Report for Duty]
    ↓
Select Location (one location)
    ↓
[Optional] Link to scheduled shift
    ↓
Confirm → Creates DutySession
    - userId: Current user
    - locationId: Selected location
    - clockInTime: Now
    - clockOutTime: null (still on duty)
    ↓
Return to Home (Status: "On Duty")
```

**Database:**
```sql
DutySession {
  userId: "guard-123"
  locationId: "sloop-marina"  -- Single location
  clockInTime: "2025-10-29 08:00"
  clockOutTime: null
}
```

**Rules:**
- ✅ Can only be on duty at ONE location
- ✅ Must sign off before reporting to another location
- ✅ Optional: Link to scheduled shift

### 2. Sign Off Duty

**Flow:**
```
Home → [Sign Off Duty]
    ↓
Show summary:
  - Location: Sloop Marina
  - Duration: 8h 15m
    ↓
[Optional] Add end-of-shift notes
    ↓
Confirm → Updates DutySession
    - clockOutTime: Now
    - notes: "All clear, no incidents"
    ↓
Return to Home (Status: "Not on Duty")
```

### 3. Report Incident

**Flow:**
```
Home → [Report Incident]
    ↓
Incident Report Form:
  - Severity (LOW/MEDIUM/HIGH/CRITICAL)
  - Incident Time
  - Title
  - Location (auto-filled if on duty)
  - Detailed Description
  - People Involved
  - Witnesses
  - Actions Taken
  - Weather Conditions
  - Follow-up Required
    ↓
Save as DRAFT or Submit as LIVE
    ↓
If severity >= HIGH → Alert supervisors
    ↓
Return to Home
```

### 4. Check Logbook

**Flow:**
```
Home → [Check Logbook]
    ↓
Select Location OR "All Locations"
    ↓
View filtered logs:
  - Incidents
  - Patrols
  - Visitor check-ins
  - Maintenance
  - Weather reports
    ↓
[Can create new log entry]
```

### 5. View Schedule

**Flow:**
```
Home → [My Schedule]
    ↓
Calendar view showing:
  - Assigned shifts
  - Date, time, location
  - Supervisor name
```

**Permissions:**
- ✅ View all logs (read-only)
- ✅ Create logs
- ✅ Edit own logs
- ✅ Soft delete own logs
- ✅ View all schedules
- ❌ Cannot manage shifts
- ❌ Cannot review incidents

---

## 👨‍✈️ SUPERVISOR Workflow (Mobile/Tablet)

**Interface**: Responsive (mobile/tablet optimized)
**Duty Type**: Roaming (all locations simultaneously)

### Landing Page (`/supervisor/home`)

```
┌─────────────────────────────────────┐
│  Marina Supervisor                  │
│  Welcome, Sarah!                    │
└─────────────────────────────────────┘

⚠️ 2 HIGH PRIORITY INCIDENTS NEED REVIEW
┌─────────────────────────────────────┐
│  🚨 Critical Incident                │
│  Sloop Marina - 2h ago              │
│  [Review Now]                       │
├─────────────────────────────────────┤
│  ⚠️  High Priority Incident          │
│  East Marina - 4h ago               │
│  [Review Now]                       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  📍 Current Status                  │
│  ● On Roaming Duty                  │
│  ⏱ Started: 7:00 AM (3h ago)       │
│  [Sign Off Duty]                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Location Check-ins Today           │
│  ✅ Sloop Marina (8:15 AM)          │
│  ✅ East Marina (9:30 AM)           │
│  ⭕ West Marina (pending)           │
│  [Check In to Location]             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Quick Actions                      │
│  📋 Review All Incidents            │
│  📅 Manage Shifts                   │
│  📍 View All Locations              │
└─────────────────────────────────────┘
```

### 1. On Sign-In: Incident Alerts

**Always Show First:**
- Unreviewed incidents (severity >= MEDIUM)
- Incidents requiring follow-up
- Sorted by severity (CRITICAL → HIGH → MEDIUM)

```sql
SELECT * FROM Log
WHERE type = 'INCIDENT'
  AND reviewedBy IS NULL
  AND severity IN ('CRITICAL', 'HIGH', 'MEDIUM')
ORDER BY
  CASE severity
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
  END,
  createdAt DESC
```

### 2. Report for Duty (Roaming)

**Flow:**
```
Home → [Report for Duty]
    ↓
Confirm roaming duty (no location selection)
    ↓
Creates DutySession
    - userId: Supervisor
    - locationId: null  ← Roaming!
    - clockInTime: Now
    ↓
Return to Home
Status: "On Roaming Duty"
```

**Database:**
```sql
DutySession {
  userId: "supervisor-456"
  locationId: null  -- Null = roaming all locations
  clockInTime: "2025-10-29 07:00"
  clockOutTime: null
}
```

**Rules:**
- ✅ Can be on duty at ALL locations simultaneously
- ✅ Must check in to each location during shift
- ✅ One roaming duty session at a time

### 3. Check In to Location

**Flow:**
```
During Duty → [Check In to Location]
    ↓
Select location from list (11 marinas)
    ↓
[Optional] Add observation notes
    ↓
Creates LocationCheckIn
    - dutySessionId: Current duty session
    - locationId: Selected location
    - checkInTime: Now
    - notes: "All guards present, area secure"
    ↓
Updates home page with ✅ check-in marker
```

**Database:**
```sql
LocationCheckIn {
  dutySessionId: "duty-789"
  locationId: "sloop-marina"
  userId: "supervisor-456"
  checkInTime: "2025-10-29 08:15"
  notes: "All guards present, area secure"
}
```

**Rules:**
- ✅ Can check in to same location multiple times
- ✅ Must be on roaming duty to check in
- ✅ Track which locations visited during shift
- ✅ Notes are optional but recommended

### 4. Review Incident Reports

**Flow:**
```
Alert → [Review Now]
    ↓
Incident Report Details:
  - All incident information
  - Guard who reported
  - Time, location, severity
    ↓
Add Review:
  - Review notes
  - Approve/Request more info
  - Close incident OR flag for admin
    ↓
Updates Log:
  - reviewedBy: Supervisor ID
  - reviewedAt: Now
  - reviewNotes: "Verified, incident handled appropriately"
    ↓
Removes from alert list
```

**Database Update:**
```sql
UPDATE Log
SET
  reviewedBy = "supervisor-456",
  reviewedAt = NOW(),
  reviewNotes = "Verified, incident handled appropriately",
  status = "UPDATED"
WHERE id = "incident-123"
```

### 5. Sign Off Duty

**Flow:**
```
Home → [Sign Off Duty]
    ↓
Show summary:
  - Duration: 8h
  - Locations checked: 8/11
  - Incidents reviewed: 3
    ↓
[Optional] End-of-shift summary
    ↓
Confirm → Updates DutySession
    - clockOutTime: Now
    ↓
Return to Home (Status: "Not on Duty")
```

**Permissions:**
- ✅ View all logs
- ✅ Create logs/incidents
- ✅ Edit any log
- ✅ Soft delete any log
- ✅ Review incidents (required)
- ✅ Create and manage shifts
- ✅ Check in to locations
- ❌ Cannot manage locations
- ❌ Cannot manage users
- ❌ Cannot hard delete

---

## 🔧 ADMIN & SUPER ADMIN Workflow (Desktop)

**Interface**: Desktop sidebar with full admin panel
**Landing**: `/admin/dashboard`

### Dashboard Overview

```
┌─────────────────────────────────────┐
│  Admin Dashboard                    │
│  Welcome, Michael!                  │
└─────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┐
│  Total   │  Active  │ Locations│   Team   │
│  Logs    │  Shifts  │          │ Members  │
│   245    │    15    │    11    │    34    │
└──────────┴──────────┴──────────┴──────────┘

┌─────────────────────────────────────┐
│  Critical Alerts                    │
│  • 1 Critical incident unreviewed   │
│  • 3 Shifts need supervisor         │
└─────────────────────────────────────┘

┌──────────────────┬──────────────────┐
│  Recent Logs     │  Upcoming Shifts │
│  ...             │  ...             │
└──────────────────┴──────────────────┘
```

### Admin Capabilities

**All Supervisor Features PLUS:**

1. **Location Management** (`/admin/locations`)
   - Create/edit/delete locations
   - Activate/deactivate locations
   - View location analytics

2. **User Management** (`/admin/users`)
   - View all users
   - Assign roles (Guard/Supervisor/Admin)
   - Deactivate users
   - View user activity

3. **Advanced Analytics** (`/admin/reports`)
   - Incident trends
   - Guard performance
   - Location statistics
   - Shift coverage analysis

### Super Admin ONLY Features

**All Admin Features PLUS:**

1. **Hard Delete** (Permanent removal)
   - Can permanently delete logs, users, locations
   - Bypasses soft delete/archive

2. **System Settings** (`/admin/settings`)
   - App-wide configuration
   - Backup/restore
   - Audit logs
   - API keys

3. **Role Management**
   - Can promote users to Admin
   - Can demote Admins

**Permissions:**
- ✅ Everything Supervisors can do
- ✅ Manage locations
- ✅ Manage users and roles
- ✅ View all analytics
- ✅ Configure system settings (SuperAdmin only)
- ✅ Hard delete (SuperAdmin only)

---

## 📊 Data Flow Summary

### Guards
```
Sign In → Mobile Home → [Choose Action]
  ├─ Report for Duty → Select Location → Clock In
  ├─ Report Incident → Form → Supervisor Alert
  ├─ Check Logbook → View Logs at Location
  └─ Sign Off Duty → Clock Out
```

### Supervisors
```
Sign In → Incident Alerts (FIRST!) → [Review] → Supervisor Home
  ├─ Report for Duty → Roaming (all locations)
  ├─ Check In to Location → Multiple times per shift
  ├─ Review Incidents → Approve/Flag
  ├─ Manage Shifts → Create/Edit Schedule
  └─ Sign Off Duty → End roaming session
```

### Admins/SuperAdmins
```
Sign In → Admin Dashboard → [Full System Management]
  ├─ View all activity
  ├─ Manage locations, users, shifts
  ├─ Analytics and reports
  └─ System settings (SuperAdmin)
```

---

## 🎯 Key Differences

| Feature | Guard | Supervisor | Admin |
|---------|-------|------------|-------|
| **Duty Type** | Single location | Roaming (all) | N/A |
| **Landing Page** | Mobile home | Incident alerts | Dashboard |
| **Location Check-ins** | No | Yes (required) | No |
| **Incident Review** | No | Yes (required) | Yes |
| **Shift Management** | View only | Create/Edit | Full control |
| **User Management** | No | No | Yes |
| **Hard Delete** | No | No | SuperAdmin only |

