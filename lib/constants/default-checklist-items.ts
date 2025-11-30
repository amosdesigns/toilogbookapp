/**
 * Default safety checklist item templates
 * These can be enabled by admins through the settings page
 */
export const DEFAULT_CHECKLIST_ITEMS = [
  {
    name: 'Fire extinguishers checked and accessible',
    description: 'Verify all fire extinguishers are in place, accessible, and pressure gauge is in green zone',
    order: 0,
  },
  {
    name: 'First aid kit stocked and accessible',
    description: 'Check first aid kit is present, fully stocked, and easily accessible',
    order: 1,
  },
  {
    name: 'Emergency exits clear and marked',
    description: 'Ensure all emergency exits are unobstructed and exit signs are illuminated',
    order: 2,
  },
  {
    name: 'Communication equipment functional',
    description: 'Test radio, phone, or other communication devices are working properly',
    order: 3,
  },
  {
    name: 'Security cameras operational',
    description: 'Verify all security cameras are functioning and recording',
    order: 4,
  },
  {
    name: 'Lighting adequate throughout facility',
    description: 'Check all lights are working in marina areas, walkways, and parking areas',
    order: 5,
  },
  {
    name: 'Gates and locks secure',
    description: 'Ensure all gates close properly and locks are functional',
    order: 6,
  },
  {
    name: 'Life jackets and safety equipment present',
    description: 'Verify life jackets, life rings, and other safety equipment are in place',
    order: 7,
  },
  {
    name: 'Dock lines and cleats in good condition',
    description: 'Check dock lines, cleats, and pilings for damage or wear',
    order: 8,
  },
  {
    name: 'Weather monitoring equipment working',
    description: 'Confirm weather radio, wind gauge, or monitoring systems are operational',
    order: 9,
  },
] as const

export type DefaultChecklistItem = (typeof DEFAULT_CHECKLIST_ITEMS)[number]
