/**
 * Centralized Prisma type definitions for action return types
 * This file eliminates the need for 'any' types across action files
 */

import { Prisma } from '@prisma/client'

// ============================================================================
// DutySession Types
// ============================================================================

export type DutySessionWithRelations = Prisma.DutySessionGetPayload<{
  include: {
    location: true
    shift: true
  }
}>

export type DutySessionWithCheckIns = Prisma.DutySessionGetPayload<{
  include: {
    location: true
    shift: true
    locationCheckIns: {
      include: {
        location: true
      }
    }
  }
}>

export type LocationCheckInWithLocation = Prisma.LocationCheckInGetPayload<{
  include: {
    location: true
  }
}>

export type DutySessionWithUser = Prisma.DutySessionGetPayload<{
  include: {
    user: {
      select: {
        id: true
        firstName: true
        lastName: true
        email: true
        role: true
      }
    }
    location: {
      select: {
        id: true
        name: true
      }
    }
  }
}>

// ============================================================================
// Log Types
// ============================================================================

export type LogWithRelations = Prisma.LogGetPayload<{
  include: {
    location: {
      select: {
        name: true
      }
    }
    user: {
      select: {
        firstName: true
        lastName: true
      }
    }
  }
}>

export type LogWithFullRelations = Prisma.LogGetPayload<{
  include: {
    location: true
    user: {
      select: {
        id: true
        firstName: true
        lastName: true
        email: true
      }
    }
    shift: true
    reviewer: {
      select: {
        firstName: true
        lastName: true
      }
    }
  }
}>

export type LogWithLocationAndUser = Prisma.LogGetPayload<{
  include: {
    location: true
    user: {
      select: {
        firstName: true
        lastName: true
      }
    }
  }
}>

// ============================================================================
// User Types
// ============================================================================

export type UserProfile = Prisma.UserGetPayload<{
  select: {
    id: true
    email: true
    username: true
    firstName: true
    lastName: true
    imageUrl: true
    phone: true
    streetAddress: true
    city: true
    state: true
    zipCode: true
    role: true
    createdAt: true
  }
}>

// ============================================================================
// Location Types
// ============================================================================

export type LocationBasic = Prisma.LocationGetPayload<{
  select: {
    id: true
    name: true
  }
}>

export type LocationWithAddress = Prisma.LocationGetPayload<{
  select: {
    id: true
    name: true
    address: true
    city: true
    state: true
    zipCode: true
    isActive: true
  }
}>

// ============================================================================
// Shift Types
// ============================================================================

export type ShiftWithRelations = Prisma.ShiftGetPayload<{
  include: {
    location: {
      select: {
        id: true
        name: true
      }
    }
    supervisor: {
      select: {
        id: true
        firstName: true
        lastName: true
      }
    }
  }
}>

export type ShiftWithAssignments = Prisma.ShiftGetPayload<{
  include: {
    location: {
      select: {
        id: true
        name: true
      }
    }
    assignments: {
      include: {
        user: {
          select: {
            id: true
            firstName: true
            lastName: true
            email: true
            role: true
          }
        }
      }
    }
  }
}>

// ============================================================================
// Message Types (for messaging system)
// ============================================================================

export type MessageWithDetails = Prisma.MessageGetPayload<{
  include: {
    sender: {
      select: {
        id: true
        firstName: true
        lastName: true
        role: true
      }
    }
    dutySession: {
      select: {
        id: true
        locationId: true
      }
    }
    replyTo: {
      select: {
        id: true
        content: true
      }
    }
  }
}>

// ============================================================================
// Incident Types
// ============================================================================

export type IncidentWithDetails = Prisma.LogGetPayload<{
  include: {
    user: {
      select: {
        firstName: true
        lastName: true
      }
    }
    location: {
      select: {
        name: true
      }
    }
  }
}>

// ============================================================================
// Tour Types
// ============================================================================

export type TourWithStops = Prisma.TourGetPayload<{
  include: {
    tourStops: {
      include: {
        location: {
          select: {
            id: true
            name: true
          }
        }
      }
    }
  }
}>

export type TourWithSupervisor = Prisma.TourGetPayload<{
  include: {
    supervisor: {
      select: {
        id: true
        firstName: true
        lastName: true
        email: true
      }
    }
    tourStops: {
      include: {
        location: {
          select: {
            id: true
            name: true
          }
        }
      }
    }
  }
}>

export type TourWithFullRelations = Prisma.TourGetPayload<{
  include: {
    supervisor: {
      select: {
        id: true
        firstName: true
        lastName: true
        email: true
      }
    }
    tourStops: {
      include: {
        location: {
          select: {
            id: true
            name: true
          }
        }
        guardUser: {
          select: {
            id: true
            firstName: true
            lastName: true
            role: true
          }
        }
      }
    }
  }
}>

export type TourStopWithRelations = Prisma.TourStopGetPayload<{
  include: {
    location: {
      select: {
        id: true
        name: true
      }
    }
    guardUser: {
      select: {
        id: true
        firstName: true
        lastName: true
        role: true
      }
    }
  }
}>

// ============================================================================
// Timesheet Types
// ============================================================================

export type TimesheetWithRelations = Prisma.TimesheetGetPayload<{
  include: {
    user: {
      select: {
        id: true
        firstName: true
        lastName: true
        email: true
      }
    }
    entries: {
      include: {
        location: {
          select: {
            name: true
          }
        }
      }
    }
    approver: {
      select: {
        firstName: true
        lastName: true
      }
    }
  }
}>

export type TimesheetWithFullDetails = Prisma.TimesheetGetPayload<{
  include: {
    user: {
      select: {
        id: true
        firstName: true
        lastName: true
        email: true
      }
    }
    entries: {
      include: {
        location: {
          select: {
            name: true
          }
        }
        shift: {
          select: {
            name: true
          }
        }
        dutySession: true
      }
    }
    adjustments: {
      include: {
        adjuster: {
          select: {
            firstName: true
            lastName: true
          }
        }
      }
    }
    approver: {
      select: {
        firstName: true
        lastName: true
      }
    }
    rejector: {
      select: {
        firstName: true
        lastName: true
      }
    }
  }
}>

export type TimesheetEntryWithLocation = Prisma.TimesheetEntryGetPayload<{
  include: {
    location: {
      select: {
        name: true
      }
    }
  }
}>

export type TimesheetEntryWithFullDetails = Prisma.TimesheetEntryGetPayload<{
  include: {
    location: {
      select: {
        name: true
      }
    }
    shift: {
      select: {
        name: true
      }
    }
    dutySession: true
  }
}>

export type UserWithDutySessions = {
  id: string
  firstName: string
  lastName: string
  role: string
}

// ============================================================================
// Supervisor Equipment Types
// ============================================================================

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
