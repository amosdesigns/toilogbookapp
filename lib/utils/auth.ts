import { Role } from '@/types'

// Role hierarchy for permission checking
const roleHierarchy: Record<Role, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  SUPERVISOR: 2,
  GUARD: 1,
}

/**
 * Check if a user has a specific role or higher
 */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Check if a user can manage (update/delete) a resource
 * Guards can only manage their own resources
 * Supervisors and above can manage any resource
 */
export function canManageResource(
  userRole: Role,
  userId: string,
  resourceOwnerId: string
): boolean {
  // SUPER_ADMIN, ADMIN, and SUPERVISOR can manage any resource
  if (hasRole(userRole, 'SUPERVISOR')) {
    return true
  }

  // GUARD can only manage their own resources
  return userId === resourceOwnerId
}

/**
 * Check if a user can perform hard delete
 * Only SUPER_ADMIN can perform hard deletes
 */
export function canHardDelete(userRole: Role): boolean {
  return userRole === 'SUPER_ADMIN'
}

/**
 * Check if a user can manage shifts
 * Only SUPERVISOR and above can manage shifts
 */
export function canManageShifts(userRole: Role): boolean {
  return hasRole(userRole, 'SUPERVISOR')
}

/**
 * Check if a user can manage locations
 * Only ADMIN and above can manage locations
 */
export function canManageLocations(userRole: Role): boolean {
  return hasRole(userRole, 'ADMIN')
}

/**
 * Check if a user can manage user roles
 * Only ADMIN and above can manage user roles
 */
export function canManageUsers(userRole: Role): boolean {
  return hasRole(userRole, 'ADMIN')
}

/**
 * Check if a user can access app-level settings
 * Only SUPER_ADMIN can access app-level settings
 */
export function canAccessAppSettings(userRole: Role): boolean {
  return userRole === 'SUPER_ADMIN'
}
