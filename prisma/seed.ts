import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data first
  console.log('🧹 Clearing existing data...')
  await prisma.alert.deleteMany()
  await prisma.maintenanceRequest.deleteMany()
  await prisma.equipment.deleteMany()
  await prisma.visitor.deleteMany()
  await prisma.asset.deleteMany()
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
      phone: '+15164507452',
      streetAddress: '37 Maple Wing Drive',
      city: 'Central Islip',
      state: 'NY',
      zipCode: '11722',
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

  // Create Assets
  console.log('Creating assets...')

  await prisma.asset.create({
    data: {
      name: 'Security Boat Alpha',
      type: 'BOAT',
      status: 'ACTIVE',
      description: 'Primary patrol boat for marina security',
      make: 'Boston Whaler',
      model: 'Guardian 21',
      year: 2022,
      serialNumber: 'BWH2022G21-001',
      registrationNumber: 'NY-1234-AB',
      locationId: locations[0].id,
      purchaseDate: new Date('2022-05-15'),
      purchasePrice: 45000,
      lastMaintenanceDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      nextMaintenanceDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.asset.create({
    data: {
      name: 'Security Vehicle #1',
      type: 'VEHICLE',
      status: 'ACTIVE',
      description: 'Ford F-150 patrol truck',
      make: 'Ford',
      model: 'F-150',
      year: 2021,
      serialNumber: 'FORD2021F150-TOI-01',
      registrationNumber: 'NY-TOI-001',
      locationId: locations[1].id,
      purchaseDate: new Date('2021-03-10'),
      purchasePrice: 38000,
    },
  })

  await prisma.asset.create({
    data: {
      name: 'Generator Backup Unit',
      type: 'EQUIPMENT',
      status: 'MAINTENANCE',
      description: 'Emergency backup generator for main office',
      make: 'Honda',
      model: 'EU7000iS',
      serialNumber: 'HONDA-GEN-7K-2020-05',
      locationId: locations[0].id,
      maintenanceNotes: 'Scheduled for oil change and filter replacement',
    },
  })

  console.log('✅ Assets created')

  // Create Visitors
  console.log('Creating visitors...')

  await prisma.visitor.create({
    data: {
      firstName: 'Michael',
      lastName: 'Roberts',
      email: 'mroberts@example.com',
      phone: '+1516555 0123',
      company: 'Marine Supplies Inc',
      purpose: 'Delivery of safety equipment',
      locationId: locations[0].id,
      checkedInBy: guard1.id,
      checkInTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      expectedDuration: 60,
      vehicleMake: 'Ford',
      vehicleModel: 'Transit',
      licensePlate: 'NY-ABC-1234',
      badgeNumber: 'V-001',
    },
  })

  await prisma.visitor.create({
    data: {
      firstName: 'Jennifer',
      lastName: 'Smith',
      email: 'jsmith@boat.com',
      phone: '+1516555 0456',
      purpose: 'Boat inspection',
      locationId: locations[1].id,
      checkedInBy: guard2.id,
      checkInTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      checkOutTime: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
      checkedOutBy: guard2.id,
      expectedDuration: 90,
      licensePlate: 'NY-XYZ-5678',
      badgeNumber: 'V-002',
    },
  })

  console.log('✅ Visitors created')

  // Create Equipment
  console.log('Creating equipment...')

  await prisma.equipment.create({
    data: {
      name: 'Radio #1',
      description: 'Motorola two-way radio',
      serialNumber: 'MOT-R1-2023-001',
      status: 'CHECKED_OUT',
      locationId: locations[0].id,
      checkedOutTo: guard1.id,
      checkedOutAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      lastMaintenance: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.equipment.create({
    data: {
      name: 'Radio #2',
      description: 'Motorola two-way radio',
      serialNumber: 'MOT-R2-2023-002',
      status: 'CHECKED_OUT',
      locationId: locations[1].id,
      checkedOutTo: guard2.id,
      checkedOutAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
  })

  await prisma.equipment.create({
    data: {
      name: 'Flashlight Set #1',
      description: 'Heavy-duty LED flashlight with batteries',
      serialNumber: 'FL-001',
      status: 'AVAILABLE',
      locationId: locations[0].id,
    },
  })

  console.log('✅ Equipment created')

  // Create Maintenance Requests
  console.log('Creating maintenance requests...')

  await prisma.maintenanceRequest.create({
    data: {
      title: 'Dock Section A - Wood Replacement',
      description: 'Several planks on Dock Section A are rotting and need replacement. Safety hazard for pedestrians.',
      priority: 'HIGH',
      status: 'PENDING',
      locationId: locations[0].id,
      reportedBy: guard1.id,
      estimatedCost: 2500,
    },
  })

  await prisma.maintenanceRequest.create({
    data: {
      title: 'Security Camera Malfunction',
      description: 'Camera #3 at main entrance is offline. Need to check power and connections.',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      locationId: locations[1].id,
      reportedBy: guard2.id,
      assignedTo: admin.id,
      assignedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      estimatedCost: 500,
    },
  })

  await prisma.maintenanceRequest.create({
    data: {
      title: 'Parking Lot Pothole Repair',
      description: 'Large pothole developing near the main parking area entrance. Needs to be filled before it gets worse.',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      locationId: locations[0].id,
      reportedBy: supervisor.id,
      assignedTo: admin.id,
      assignedAt: new Date(now.getTime() - 72 * 60 * 60 * 1000),
      completedBy: admin.id,
      completedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      resolution: 'Pothole filled with asphalt patch. Area monitored for settlement.',
      estimatedCost: 300,
      actualCost: 275,
    },
  })

  console.log('✅ Maintenance requests created')

  // Create Alerts
  console.log('Creating alerts...')

  await prisma.alert.create({
    data: {
      title: 'Storm Warning - Secure All Equipment',
      message: 'National Weather Service has issued a severe storm warning for tonight. Please secure all loose equipment, boats, and outdoor furniture. High winds expected.',
      priority: 'CRITICAL',
      locationId: null, // All locations
      targetRole: null, // All roles
      createdBy: supervisor.id,
      activeFrom: new Date(),
      activeUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      isActive: true,
    },
  })

  await prisma.alert.create({
    data: {
      title: 'Security Briefing - Friday 2PM',
      message: 'Mandatory security briefing for all guards this Friday at 2PM in the main office. Topics include new protocols and equipment updates.',
      priority: 'INFO',
      targetRole: 'GUARD',
      createdBy: supervisor.id,
      activeFrom: new Date(),
      activeUntil: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  })

  await prisma.alert.create({
    data: {
      title: 'Atlantique Marina - Suspicious Activity',
      message: 'Be alert: Recent reports of suspicious individuals near the fuel dock area. If seen, do not approach - call supervisor immediately.',
      priority: 'WARNING',
      locationId: locations[0].id,
      createdBy: supervisor.id,
      activeFrom: new Date(),
      isActive: true,
    },
  })

  console.log('✅ Alerts created')

  console.log('🎉 Seed completed successfully!')
  console.log(`
    Created:
    - 6 Users (1 Super Admin, 1 Admin, 1 Supervisor, 3 Guards)
    - 14 Marina Locations
    - 2 Shifts
    - 4 Duty Sessions (3 active, 1 completed)
    - 2 Location Check-ins
    - 11 Log Entries (including incidents, patrols, maintenance, etc.)
    - 3 Assets (boat, vehicle, equipment)
    - 2 Visitors (1 current, 1 checked out)
    - 3 Equipment items (2 checked out, 1 available)
    - 3 Maintenance Requests (pending, in-progress, completed)
    - 3 Alerts (critical, info, warning)
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
