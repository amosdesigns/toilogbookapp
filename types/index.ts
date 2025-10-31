import { Role } from '@/lib/validations'

export type { Role }

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

export interface Location {
  id: string
  name: string
  description: string | null
  address: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Shift {
  id: string
  name: string
  startTime: Date
  endTime: Date
  locationId: string
  supervisorId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Log {
  id: string
  type: 'INCIDENT' | 'PATROL' | 'VISITOR_CHECKIN' | 'MAINTENANCE' | 'WEATHER' | 'OTHER'
  title: string
  description: string
  status: 'LIVE' | 'UPDATED' | 'ARCHIVED' | 'DRAFT'
  locationId: string
  shiftId: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
  archivedAt: Date | null
}
