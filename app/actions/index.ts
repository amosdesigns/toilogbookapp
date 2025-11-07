/**
 * Server Actions Index
 *
 * Centralized exports for all Server Actions in the application.
 * Server Actions replace API routes for internal mutations and data operations.
 *
 * Import examples:
 *   import { clockIn, clockOut } from '@/app/actions'
 *   import { reviewIncident } from '@/app/actions'
 */

// Duty Sessions
export {
  clockIn,
  clockOut,
  getCurrentDutySession,
  getDutySession,
} from './duty-sessions'

// Guards On Duty
export {
  getGuardsOnDuty,
  forceClockOut,
} from './guards-on-duty'

// Incidents
export {
  getUnreviewedIncidents,
  reviewIncident,
  getIncidentsByStatus,
} from './incidents'

// Location Check-ins
export {
  checkInToLocation,
  getLocationCheckIns,
  getMyRecentCheckIns,
} from './location-checkins'

// Locations
export {
  getLocations,
  getLocation,
} from './locations'

// Logs
export {
  getLogs,
  getLog,
  createLog,
  updateLog,
  deleteLog,
} from './logs'

// Messages
export {
  sendMessage,
  getMessages,
} from './messages'

// Notifications
export {
  getNotifications,
  dismissNotification,
  createSystemNotification,
} from './notifications'

export type { Notification } from './notifications'

// Profile
export {
  getMyProfile,
  getMyDutySessions,
  getMyLogs,
  updateMyProfile,
} from './profile'
