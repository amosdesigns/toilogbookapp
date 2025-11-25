// Centralized type definitions for the application

// ============================================================================
// User & Authentication
// ============================================================================

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "SUPERVISOR" | "GUARD"

export interface User {
  id: string
  clerkId?: string
  email: string
  username?: string
  firstName: string
  lastName: string
  imageUrl?: string
  phone?: string
  streetAddress?: string
  city?: string
  state?: string
  zipCode?: string
  role: UserRole
  createdAt?: Date
  updatedAt?: Date
}

// ============================================================================
// Location
// ============================================================================

export interface Location {
  id: string
  name: string
  description?: string
  address?: string
  isActive?: boolean
  maxCapacity: number | null
  createdAt?: Date
  updatedAt?: Date
}

export interface LocationWithDetails extends Location {
  shifts?: Shift[]
  logs?: Log[]
}

// ============================================================================
// Duty Session
// ============================================================================

export interface DutySession {
  id: string
  userId: string
  locationId: string | null
  shiftId?: string | null
  clockInTime: Date
  clockOutTime: Date | null
  notes?: string | null
  location?: {
    id: string
    name: string
  } | null
  user?: {
    firstName: string
    lastName: string
  }
}

export interface GuardOnDuty {
  userId: string
  userName: string
  userEmail: string
  role: string
  dutySessionId: string
  locationId: string | null
  locationName: string | null
  clockInTime: Date
  hoursOnDuty: string
}

export interface LocationCheckIn {
  id: string
  dutySessionId: string
  locationId: string
  userId: string
  checkInTime: Date
  notes?: string | null
  location?: Location
}

// ============================================================================
// Shift Management
// ============================================================================

export interface ShiftAssignment {
  id: string
  shiftId: string
  userId: string
  role: string | null
  user: User
  createdAt?: Date
  updatedAt?: Date
}

export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  locationId: string
  recurringPatternId?: string | null
  location: {
    id: string
    name: string
  }
  assignments: ShiftAssignment[]
  createdAt?: Date
  updatedAt?: Date
}

export interface RecurringShiftPattern {
  id: string
  name: string
  locationId: string
  startTime: string
  endTime: string
  daysOfWeek: string | number[] // JSON string or array: [0,1,2,3,4,5,6]
  isActive: boolean
  startDate: Date
  endDate?: Date | null
  location?: Location
  userAssignments?: RecurringUserAssignment[]
  createdAt?: Date
  updatedAt?: Date
}

export interface RecurringUserAssignment {
  id: string
  recurringPatternId: string
  userId: string
  role: string | null
  user: User
  createdAt?: Date
  updatedAt?: Date
}

// ============================================================================
// Logs & Incidents
// ============================================================================

export type LogType =
  | "INCIDENT"
  | "PATROL"
  | "VISITOR_CHECKIN"
  | "MAINTENANCE"
  | "WEATHER"
  | "ON_DUTY_CHECKLIST"
  | "OTHER"

export type RecordStatus = "LIVE" | "UPDATED" | "ARCHIVED" | "DRAFT"

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface Log {
  id: string
  type: LogType
  title: string
  description: string
  status: RecordStatus
  locationId: string
  shiftId?: string | null
  userId: string
  severity?: IncidentSeverity | null
  incidentTime?: Date | null
  peopleInvolved?: string | null
  witnesses?: string | null
  actionsTaken?: string | null
  followUpRequired?: boolean | null
  followUpNotes?: string | null
  weatherConditions?: string | null
  photoUrls?: string | null
  videoUrls?: string | null
  reviewedBy?: string | null
  reviewedAt?: Date | null
  reviewNotes?: string | null
  location?: Location
  user?: User
  createdAt: Date
  updatedAt: Date
  archivedAt?: Date | null
}

export interface IncidentReport {
  id: string
  title: string
  description: string
  severity: IncidentSeverity | null
  status: RecordStatus
  incidentTime: Date | null
  location: {
    id?: string
    name: string
  }
  user: {
    id?: string
    firstName: string
    lastName: string
  }
  peopleInvolved?: string | null
  witnesses?: string | null
  actionsTaken?: string | null
  followUpRequired?: boolean | null
  followUpNotes?: string | null
  reviewedBy?: string | null
  reviewedAt?: Date | null
  reviewNotes?: string | null
  createdAt: Date
  updatedAt?: Date
}

// ============================================================================
// Safety Checklist
// ============================================================================

export interface SafetyChecklistItem {
  id: string
  name: string
  description?: string | null
  order: number
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface SafetyChecklistItemCheck {
  id: string
  safetyChecklistResponseId: string
  safetyChecklistItemId: string
  checked: boolean
  notes?: string | null
  item?: SafetyChecklistItem
  createdAt?: Date
  updatedAt?: Date
}

export interface SafetyChecklistResponse {
  id: string
  dutySessionId: string
  userId: string
  locationId: string
  logId?: string | null
  completedAt: Date
  itemChecks?: SafetyChecklistItemCheck[]
  location?: Location
  user?: User
  createdAt?: Date
  updatedAt?: Date
}

// ============================================================================
// Notifications & Alerts
// ============================================================================

export type NotificationAction =
  | "ADDED"
  | "SIGNED_IN"
  | "DELETED"
  | "UPDATED"

export type NotificationTarget =
  | "USER_PROFILE"
  | "EMAIL"
  | "SUPERVISOR"
  | "SUPERADMIN"
  | "GUARD"
  | "COMMENT"

export type AlertPriority = "INFO" | "WARNING" | "CRITICAL"

export interface Notification {
  id: string
  user: string
  action: NotificationAction
  target: NotificationTarget
  message?: string | null
  unread: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Alert {
  id: string
  title: string
  message: string
  priority: AlertPriority
  locationId?: string | null
  location?: Location | null
  targetRole?: UserRole | null
  activeFrom: Date
  activeUntil?: Date | null
  acknowledgedBy?: string | null
  createdBy: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Assets & Equipment
// ============================================================================

export type AssetType = "BOAT" | "VEHICLE" | "EQUIPMENT" | "FACILITY" | "OTHER"
export type AssetStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "DAMAGED"
export type EquipmentStatus = "AVAILABLE" | "CHECKED_OUT" | "MAINTENANCE" | "LOST" | "DAMAGED"

export interface Asset {
  id: string
  name: string
  type: AssetType
  status: AssetStatus
  description?: string | null
  make?: string | null
  model?: string | null
  year?: number | null
  serialNumber?: string | null
  registrationNumber?: string | null
  locationId?: string | null
  location?: Location | null
  assignedTo?: string | null
  purchaseDate?: Date | null
  purchasePrice?: number | null
  insuranceInfo?: string | null
  lastMaintenanceDate?: Date | null
  nextMaintenanceDate?: Date | null
  maintenanceNotes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Equipment {
  id: string
  name: string
  description?: string | null
  serialNumber?: string | null
  status: EquipmentStatus
  locationId?: string | null
  location?: Location | null
  checkedOutTo?: string | null
  checkedOutAt?: Date | null
  expectedReturnAt?: Date | null
  lastMaintenance?: Date | null
  nextMaintenance?: Date | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Visitors
// ============================================================================

export interface Visitor {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  company?: string | null
  purpose?: string | null
  locationId: string
  location?: Location
  checkInTime: Date
  checkOutTime?: Date | null
  expectedDuration?: number | null
  checkedInBy: string
  checkedOutBy?: string | null
  vehicleMake?: string | null
  vehicleModel?: string | null
  licensePlate?: string | null
  badgeNumber?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Maintenance
// ============================================================================

export type MaintenanceStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

export interface MaintenanceRequest {
  id: string
  title: string
  description: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  locationId: string
  location?: Location
  reportedBy: string
  reportedAt: Date
  assignedTo?: string | null
  assignedAt?: Date | null
  completedBy?: string | null
  completedAt?: Date | null
  resolution?: string | null
  estimatedCost?: number | null
  actualCost?: number | null
  photoUrls?: string | null
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Form Data Types (for react-hook-form)
// ============================================================================

export interface LogFormData {
  type: LogType
  title: string
  description: string
  locationId: string
  shiftId?: string
  severity?: IncidentSeverity
  incidentTime?: Date
  peopleInvolved?: string
  witnesses?: string
  actionsTaken?: string
  followUpRequired?: boolean
  followUpNotes?: string
  weatherConditions?: string
}

export interface IncidentReviewFormData {
  reviewNotes: string
}

export interface ClockInFormData {
  locationId?: string
  shiftId?: string
}

export interface LocationCheckInFormData {
  locationId: string
  notes?: string
}
