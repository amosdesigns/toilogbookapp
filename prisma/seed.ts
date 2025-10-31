import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data first
  console.log('🧹 Clearing existing data...')
  await prisma.locationCheckIn.deleteMany()
  await prisma.log.deleteMany()
  await prisma.dutySession.deleteMany()
  await prisma.shift.deleteMany()
  await prisma.location.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Database cleared successfully')

  // Create Users
  console.log('Creating users...')

  const superAdmin = await prisma.user.upsert({
    where: { email: 'mail@amosdesigns.net' },
    update: {},
    create: {
      clerkId: 'clerk_superadmin_001',
      email: 'mail@amosdesigns.net',
      firstName: 'Jerome',
      lastName: 'Amos',
      role: 'SUPER_ADMIN',
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_admin_001',
      email: 'admin@toi.gov',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'ADMIN',
    },
  })

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_supervisor_001',
      email: 'supervisor@toi.gov',
      firstName: 'David',
      lastName: 'Martinez',
      role: 'SUPERVISOR',
    },
  })

  const guard1 = await prisma.user.upsert({
    where: { email: 'guard1@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_guard_001',
      email: 'guard1@toi.gov',
      firstName: 'James',
      lastName: 'Wilson',
      role: 'GUARD',
    },
  })

  const guard2 = await prisma.user.upsert({
    where: { email: 'guard2@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_guard_002',
      email: 'guard2@toi.gov',
      firstName: 'Maria',
      lastName: 'Garcia',
      role: 'GUARD',
    },
  })

  const guard3 = await prisma.user.upsert({
    where: { email: 'guard3@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_guard_003',
      email: 'guard3@toi.gov',
      firstName: 'Robert',
      lastName: 'Chen',
      role: 'GUARD',
    },
  })

  console.log('✅ Users created')

  // Create 14 Marina Locations
  console.log('Creating marina locations...')

  const locationNames = [
    { name: 'Atlantique Marina', code: 'ATLANTIQUE' },
    { name: 'Bay Shore Marina', code: 'BAYSHORE' },
    { name: "Brown's River East Side", code: 'BROWNRIVEREAST' },
    { name: "Brown's River West Side", code: 'BROWNRIVERWEST' },
    { name: 'East Islip Marina', code: 'EASTISLIP' },
    { name: 'Great River Ramp', code: 'GREATRIVER' },
    { name: 'Homan Creek Dock', code: 'HOMANCREEK' },
    { name: 'Maple Avenue Dock', code: 'MAPLEAVENUE' },
    { name: 'Maple Street Dock', code: 'MAPLESTREET' },
    { name: 'Ocean Avenue Marina', code: 'OCEANAVENUE' },
    { name: "Port O'Call Marina", code: 'PORTOCALL' },
    { name: 'Raymond Street Dock', code: 'RAYMONDSTREET' },
    { name: 'West Avenue Dock', code: 'WESTAVENUE' },
    { name: 'West Islip Marina', code: 'WESTISLIP' },
  ]

  const locations = []
  for (const loc of locationNames) {
    const location = await prisma.location.upsert({
      where: { name: loc.name },
      update: {},
      create: {
        name: loc.name,
        description: `${loc.code} - Marina facility`,
        address: `${loc.name}, Town of Islip, NY`,
        isActive: true,
      },
    })
    locations.push(location)
  }

  console.log('✅ Locations created')

  // Create Shifts
  console.log('Creating shifts...')

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const shift1 = await prisma.shift.create({
    data: {
      name: 'Morning Shift - Captree',
      startTime: new Date(todayStart.getTime() + 8 * 60 * 60 * 1000), // 8 AM
      endTime: new Date(todayStart.getTime() + 16 * 60 * 60 * 1000), // 4 PM
      locationId: locations[0].id,
      supervisorId: supervisor.id,
    },
  })

  const shift2 = await prisma.shift.create({
    data: {
      name: 'Evening Shift - Bayport',
      startTime: new Date(todayStart.getTime() + 16 * 60 * 60 * 1000), // 4 PM
      endTime: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000), // 12 AM
      locationId: locations[1].id,
    },
  })

  console.log('✅ Shifts created')

  // Create Active Duty Sessions
  console.log('Creating duty sessions...')

  // Guard 1 - Currently on duty at Captree
  const dutySession1 = await prisma.dutySession.create({
    data: {
      userId: guard1.id,
      locationId: locations[0].id,
      shiftId: shift1.id,
      clockInTime: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      clockOutTime: null, // Still on duty
    },
  })

  // Guard 2 - Currently on duty at Bayport
  const dutySession2 = await prisma.dutySession.create({
    data: {
      userId: guard2.id,
      locationId: locations[1].id,
      clockInTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      clockOutTime: null, // Still on duty
    },
  })

  // Supervisor - Currently on roaming duty
  const supervisorDuty = await prisma.dutySession.create({
    data: {
      userId: supervisor.id,
      locationId: null, // Roaming
      clockInTime: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
      clockOutTime: null, // Still on duty
    },
  })

  // Historical duty session (completed)
  await prisma.dutySession.create({
    data: {
      userId: guard3.id,
      locationId: locations[2].id,
      clockInTime: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
      clockOutTime: new Date(now.getTime() - 16 * 60 * 60 * 1000), // 8 hours later
    },
  })

  console.log('✅ Duty sessions created')

  // Create Location Check-ins (for supervisor roaming)
  console.log('Creating location check-ins...')

  await prisma.locationCheckIn.create({
    data: {
      dutySessionId: supervisorDuty.id,
      locationId: locations[0].id,
      userId: supervisor.id,
      checkInTime: new Date(now.getTime() - 2.5 * 60 * 60 * 1000),
      notes: 'All systems operational. Guards present and alert.',
    },
  })

  await prisma.locationCheckIn.create({
    data: {
      dutySessionId: supervisorDuty.id,
      locationId: locations[1].id,
      userId: supervisor.id,
      checkInTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      notes: 'Completed rounds. No issues to report.',
    },
  })

  console.log('✅ Location check-ins created')

  // Create Log Entries
  console.log('Creating log entries...')

  // Critical Incident - Unreviewed
  await prisma.log.create({
    data: {
      type: 'INCIDENT',
      title: 'Unauthorized Access Attempt',
      description: 'Attempted unauthorized entry to restricted dock area. Individual was intercepted and escorted off premises.',
      status: 'LIVE',
      severity: 'CRITICAL',
      incidentTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      peopleInvolved: 'Unknown male, approximately 30-35 years old, wearing dark clothing',
      witnesses: 'Two boat owners: John Smith and Mary Johnson',
      actionsTaken: 'Individual was stopped, identified, and asked to leave. Security was notified. Police were called as precaution.',
      followUpRequired: true,
      followUpNotes: 'Need to review security camera footage and file formal report with local police.',
      locationId: locations[0].id,
      userId: guard1.id,
    },
  })

  // High Severity Incident - Unreviewed
  await prisma.log.create({
    data: {
      type: 'INCIDENT',
      title: 'Boat Collision in Marina',
      description: 'Two boats collided at low speed while docking. Minor damage to both vessels. No injuries.',
      status: 'LIVE',
      severity: 'HIGH',
      incidentTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      peopleInvolved: 'Captain A: Mike Thompson, Captain B: Lisa Davis',
      actionsTaken: 'Documented damage with photos. Exchanged insurance information between parties. Filed incident report.',
      followUpRequired: true,
      followUpNotes: 'Insurance companies need to be contacted. Damage assessment required.',
      weatherConditions: 'Windy, gusts up to 20mph',
      locationId: locations[1].id,
      userId: guard2.id,
    },
  })

  // Medium Incident - Reviewed
  await prisma.log.create({
    data: {
      type: 'INCIDENT',
      title: 'Medical Emergency - Heat Exhaustion',
      description: 'Elderly visitor experienced heat exhaustion symptoms. First aid provided on scene.',
      status: 'UPDATED',
      severity: 'MEDIUM',
      incidentTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      peopleInvolved: 'Visitor: Helen Brown, age 72',
      actionsTaken: 'Moved to shade, provided water, contacted EMS. Patient recovered before ambulance arrival.',
      followUpRequired: false,
      weatherConditions: 'Hot and sunny, 92°F',
      reviewedBy: supervisor.id,
      reviewedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
      reviewNotes: 'Well handled. Recommend posting heat advisory signs during summer months.',
      locationId: locations[2].id,
      userId: guard3.id,
    },
  })

  // Patrol Logs
  await prisma.log.create({
    data: {
      type: 'PATROL',
      title: 'Evening Patrol - All Clear',
      description: 'Completed full perimeter patrol. All docks checked. No suspicious activity.',
      status: 'LIVE',
      locationId: locations[0].id,
      userId: guard1.id,
    },
  })

  await prisma.log.create({
    data: {
      type: 'PATROL',
      title: 'Morning Security Check',
      description: 'Inspected all gates, locks, and security equipment. Everything functioning properly.',
      status: 'LIVE',
      locationId: locations[1].id,
      userId: guard2.id,
    },
  })

  // Visitor Check-ins
  await prisma.log.create({
    data: {
      type: 'VISITOR_CHECKIN',
      title: 'Marina Tour Group',
      description: 'Checked in group of 15 visitors for scheduled marina tour. Verified all had visitor passes.',
      status: 'LIVE',
      locationId: locations[0].id,
      userId: guard1.id,
    },
  })

  // Maintenance Issues
  await prisma.log.create({
    data: {
      type: 'MAINTENANCE',
      title: 'Dock Light Malfunction',
      description: 'Three dock lights in section C are not working. Need replacement bulbs or wiring check.',
      status: 'LIVE',
      locationId: locations[3].id,
      userId: guard2.id,
    },
  })

  await prisma.log.create({
    data: {
      type: 'MAINTENANCE',
      title: 'Gate Hinge Needs Repair',
      description: 'Main entrance gate is squeaking and difficult to close. Hinges need lubrication or replacement.',
      status: 'ARCHIVED',
      locationId: locations[1].id,
      userId: guard3.id,
      archivedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
  })

  // Weather Logs
  await prisma.log.create({
    data: {
      type: 'WEATHER',
      title: 'Storm Watch Alert',
      description: 'National Weather Service issued storm watch. Secured all loose equipment. Advised boat owners.',
      status: 'UPDATED',
      locationId: locations[0].id,
      userId: guard1.id,
    },
  })

  // Other Logs
  await prisma.log.create({
    data: {
      type: 'OTHER',
      title: 'Lost and Found - Wallet',
      description: 'Found wallet on dock D. Contains ID for local resident. Secured in office.',
      status: 'LIVE',
      locationId: locations[2].id,
      userId: guard3.id,
    },
  })

  console.log('✅ Log entries created')

  console.log('🎉 Seed completed successfully!')
  console.log(`
    Created:
    - 6 Users (1 Super Admin, 1 Admin, 1 Supervisor, 3 Guards)
    - 14 Marina Locations
    - 2 Shifts
    - 4 Duty Sessions (3 active, 1 completed)
    - 2 Location Check-ins
    - 11 Log Entries (including incidents, patrols, maintenance, etc.)
  `)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
