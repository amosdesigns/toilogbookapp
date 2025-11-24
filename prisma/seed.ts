import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data first using raw SQL with CASCADE
  console.log('🧹 Clearing existing data...')

  // Disable triggers and use TRUNCATE CASCADE for faster deletion
  await prisma.$executeRaw`TRUNCATE TABLE "Alert" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "MaintenanceRequest" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "Equipment" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "Visitor" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "Asset" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "notifications" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "SafetyChecklistItemCheck" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "SafetyChecklistResponse" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "SafetyChecklistItem" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "LocationCheckIn" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "Log" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "DutySession" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "ShiftAssignment" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "RecurringUserAssignment" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "Shift" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "RecurringShiftPattern" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "Location" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`

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

  // Add 15 new users (10 Guards, 3 Supervisors, 1 Admin, 1 Super Admin)
  console.log('Creating 15 additional users...')

  const newSuperAdmin = await prisma.user.upsert({
    where: { email: 'superadmin2@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_superadmin_002',
      email: 'superadmin2@toi.gov',
      firstName: 'Patricia',
      lastName: 'Thompson',
      role: 'SUPER_ADMIN',
    },
  })

  const newAdmin = await prisma.user.upsert({
    where: { email: 'admin2@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_admin_002',
      email: 'admin2@toi.gov',
      firstName: 'Michael',
      lastName: 'Rodriguez',
      role: 'ADMIN',
    },
  })

  const supervisor2 = await prisma.user.upsert({
    where: { email: 'supervisor2@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_supervisor_002',
      email: 'supervisor2@toi.gov',
      firstName: 'Jennifer',
      lastName: 'Lee',
      role: 'SUPERVISOR',
    },
  })

  const supervisor3 = await prisma.user.upsert({
    where: { email: 'supervisor3@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_supervisor_003',
      email: 'supervisor3@toi.gov',
      firstName: 'Christopher',
      lastName: 'Brown',
      role: 'SUPERVISOR',
    },
  })

  const supervisor4 = await prisma.user.upsert({
    where: { email: 'supervisor4@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_supervisor_004',
      email: 'supervisor4@toi.gov',
      firstName: 'Amanda',
      lastName: 'Taylor',
      role: 'SUPERVISOR',
    },
  })

  const guard4 = await prisma.user.upsert({
    where: { email: 'guard4@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_guard_004',
      email: 'guard4@toi.gov',
      firstName: 'Daniel',
      lastName: 'Anderson',
      role: 'GUARD',
    },
  })

  const guard5 = await prisma.user.upsert({
    where: { email: 'guard5@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_guard_005',
      email: 'guard5@toi.gov',
      firstName: 'Jessica',
      lastName: 'Thomas',
      role: 'GUARD',
    },
  })

  const guard6 = await prisma.user.upsert({
    where: { email: 'guard6@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_guard_006',
      email: 'guard6@toi.gov',
      firstName: 'Matthew',
      lastName: 'Jackson',
      role: 'GUARD',
    },
  })

  const guard7 = await prisma.user.upsert({
    where: { email: 'guard7@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_guard_007',
      email: 'guard7@toi.gov',
      firstName: 'Ashley',
      lastName: 'White',
      role: 'GUARD',
    },
  })

  const guard8 = await prisma.user.upsert({
    where: { email: 'guard8@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_guard_008',
      email: 'guard8@toi.gov',
      firstName: 'Joshua',
      lastName: 'Harris',
      role: 'GUARD',
    },
  })

  const guard9 = await prisma.user.upsert({
    where: { email: 'guard9@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_guard_009',
      email: 'guard9@toi.gov',
      firstName: 'Emily',
      lastName: 'Martin',
      role: 'GUARD',
    },
  })

  const guard10 = await prisma.user.upsert({
    where: { email: 'guard10@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_guard_010',
      email: 'guard10@toi.gov',
      firstName: 'Andrew',
      lastName: 'Clark',
      role: 'GUARD',
    },
  })

  const guard11 = await prisma.user.upsert({
    where: { email: 'guard11@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_guard_011',
      email: 'guard11@toi.gov',
      firstName: 'Samantha',
      lastName: 'Lewis',
      role: 'GUARD',
    },
  })

  const guard12 = await prisma.user.upsert({
    where: { email: 'guard12@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_guard_012',
      email: 'guard12@toi.gov',
      firstName: 'Ryan',
      lastName: 'Walker',
      role: 'GUARD',
    },
  })

  const guard13 = await prisma.user.upsert({
    where: { email: 'guard13@toi.gov' },
    update: {},
    create: {
      clerkId: 'clerk_guard_013',
      email: 'guard13@toi.gov',
      firstName: 'Nicole',
      lastName: 'Hall',
      role: 'GUARD',
    },
  })

  const guards = [guard1, guard2, guard3, guard4, guard5, guard6, guard7, guard8, guard9, guard10, guard11, guard12, guard13]
  const supervisors = [supervisor, supervisor2, supervisor3, supervisor4]

  console.log('✅ All users created (21 total: 2 Super Admins, 2 Admins, 4 Supervisors, 13 Guards)')

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
        maxCapacity: Math.floor(Math.random() * 3) + 2, // Random capacity 2-4 guards per shift
      },
    })
    locations.push(location)
  }

  console.log('✅ Locations created with capacity limits')

  // Create Recurring Shift Patterns
  console.log('Creating recurring shift patterns...')

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Define shift templates (varying lengths based on season/time of year)
  const shiftTemplates = [
    { name: 'Morning Shift', startTime: '06:00', endTime: '14:00', hours: 8 }, // 8 hours
    { name: 'Day Shift', startTime: '08:00', endTime: '16:00', hours: 8 }, // 8 hours
    { name: 'Afternoon Shift', startTime: '14:00', endTime: '20:00', hours: 6 }, // 6 hours (shorter)
    { name: 'Evening Shift', startTime: '16:00', endTime: '23:00', hours: 7 }, // 7 hours
    { name: 'Night Shift', startTime: '22:00', endTime: '06:00', hours: 8 }, // 8 hours (overnight)
  ]

  const recurringPatterns = []

  // Create recurring patterns for select locations (not all 14, to keep it manageable)
  const activeLocations = locations.slice(0, 8) // Use first 8 locations

  for (let i = 0; i < activeLocations.length; i++) {
    const location = activeLocations[i]
    const template = shiftTemplates[i % shiftTemplates.length]

    // Create pattern for weekdays (Mon-Fri)
    const weekdayPattern = await prisma.recurringShiftPattern.create({
      data: {
        name: `${template.name} - ${location.name} (Weekdays)`,
        locationId: location.id,
        startTime: template.startTime,
        endTime: template.endTime,
        daysOfWeek: JSON.stringify([1, 2, 3, 4, 5]), // Mon-Fri
        isActive: true,
        startDate: todayStart,
        endDate: null, // Indefinite
      },
    })
    recurringPatterns.push(weekdayPattern)

    // Create pattern for weekends (Sat-Sun) if applicable
    if (i % 2 === 0) {
      const weekendPattern = await prisma.recurringShiftPattern.create({
        data: {
          name: `${template.name} - ${location.name} (Weekends)`,
          locationId: location.id,
          startTime: template.startTime,
          endTime: template.endTime,
          daysOfWeek: JSON.stringify([0, 6]), // Sun, Sat
          isActive: true,
          startDate: todayStart,
          endDate: null,
        },
      })
      recurringPatterns.push(weekendPattern)
    }
  }

  console.log(`✅ Created ${recurringPatterns.length} recurring shift patterns`)

  // Assign default users to recurring patterns
  console.log('Assigning users to recurring patterns...')

  for (let i = 0; i < recurringPatterns.length; i++) {
    const pattern = recurringPatterns[i]
    const numAssignments = Math.floor(Math.random() * 2) + 1 // 1-2 guards per recurring pattern

    for (let j = 0; j < numAssignments; j++) {
      const guard = guards[(i * 2 + j) % guards.length]
      await prisma.recurringUserAssignment.create({
        data: {
          recurringPatternId: pattern.id,
          userId: guard.id,
          role: j === 0 ? 'PRIMARY' : 'BACKUP',
        },
      })
    }
  }

  console.log('✅ Users assigned to recurring patterns')

  // Generate actual shifts for next 30 days based on recurring patterns
  console.log('Generating shifts for next 30 days...')

  const shifts = []
  const shiftAssignments = []

  for (let day = 0; day < 30; day++) {
    const currentDate = new Date(todayStart)
    currentDate.setDate(currentDate.getDate() + day)
    const dayOfWeek = currentDate.getDay() // 0=Sunday, 6=Saturday

    for (const pattern of recurringPatterns) {
      const daysOfWeek = JSON.parse(pattern.daysOfWeek)

      // Check if this pattern applies to current day
      if (daysOfWeek.includes(dayOfWeek)) {
        const [startHour, startMin] = pattern.startTime.split(':').map(Number)
        const [endHour, endMin] = pattern.endTime.split(':').map(Number)

        const shiftStart = new Date(currentDate)
        shiftStart.setHours(startHour, startMin, 0, 0)

        const shiftEnd = new Date(currentDate)
        shiftEnd.setHours(endHour, endMin, 0, 0)

        // Handle overnight shifts
        if (endHour < startHour) {
          shiftEnd.setDate(shiftEnd.getDate() + 1)
        }

        const shift = await prisma.shift.create({
          data: {
            name: pattern.name,
            startTime: shiftStart,
            endTime: shiftEnd,
            locationId: pattern.locationId,
            recurringPatternId: pattern.id,
          },
        })
        shifts.push(shift)

        // Assign users from the recurring pattern
        const patternAssignments = await prisma.recurringUserAssignment.findMany({
          where: { recurringPatternId: pattern.id },
        })

        for (const assignment of patternAssignments) {
          const shiftAssignment = await prisma.shiftAssignment.create({
            data: {
              shiftId: shift.id,
              userId: assignment.userId,
              role: assignment.role,
            },
          })
          shiftAssignments.push(shiftAssignment)
        }
      }
    }
  }

  console.log(`✅ Generated ${shifts.length} shifts with ${shiftAssignments.length} assignments for next 30 days`)

  // Create Active Duty Sessions
  console.log('Creating duty sessions...')

  // Get today's shifts for linking duty sessions
  const todayShifts = shifts.filter(s => {
    const shiftDate = new Date(s.startTime)
    return shiftDate.toDateString() === todayStart.toDateString()
  })

  // Guard 1 - Currently on duty at Atlantique Marina
  const dutySession1 = await prisma.dutySession.create({
    data: {
      userId: guard1.id,
      locationId: locations[0].id, // Atlantique Marina
      shiftId: todayShifts[0]?.id,
      clockInTime: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8 hours ago
      clockOutTime: null, // Still on duty
    },
  })

  // Guard 2 - Currently on duty at Atlantique Marina (same location as Guard 1)
  const dutySession2 = await prisma.dutySession.create({
    data: {
      userId: guard2.id,
      locationId: locations[0].id, // Atlantique Marina (same location!)
      shiftId: todayShifts[1]?.id,
      clockInTime: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
      clockOutTime: null, // Still on duty
    },
  })

  // Jerome (Super Admin) - Currently on duty at Atlantique Marina (testing location-based filtering)
  const jeromeDutySession = await prisma.dutySession.create({
    data: {
      userId: superAdmin.id,
      locationId: locations[0].id, // Atlantique Marina
      shiftId: todayShifts[2]?.id,
      clockInTime: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
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

  // Create Log Entries for all users
  console.log('Creating log entries for all users...')

  const logEntries = [
    // === INCIDENTS ===
    // Guard 1 - Critical Incident
    {
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
    // Guard 2 - High Severity
    {
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
    // Guard 3 - Medium Incident (Reviewed)
    {
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
    // Guard 4 - Low Severity
    {
      type: 'INCIDENT',
      title: 'Minor Parking Dispute',
      description: 'Two visitors had disagreement over parking space. Situation resolved amicably.',
      status: 'UPDATED',
      severity: 'LOW',
      incidentTime: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      peopleInvolved: 'Visitor 1: Mark Stevens, Visitor 2: Tom Williams',
      actionsTaken: 'Mediated discussion, clarified parking rules, both parties satisfied.',
      followUpRequired: false,
      reviewedBy: supervisor2.id,
      reviewedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
      reviewNotes: 'Good conflict resolution. No further action needed.',
      locationId: locations[3].id,
      userId: guard4.id,
    },
    // Guard 5 - High Severity (Unreviewed)
    {
      type: 'INCIDENT',
      title: 'Fuel Spill Incident',
      description: 'Small fuel spill occurred during boat refueling. Immediate cleanup initiated.',
      status: 'LIVE',
      severity: 'HIGH',
      incidentTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      peopleInvolved: 'Boat owner: Richard Cooper',
      actionsTaken: 'Activated spill containment protocol. Used absorbent pads. Notified harbor master and environmental agency.',
      followUpRequired: true,
      followUpNotes: 'Environmental impact assessment needed. File official report.',
      weatherConditions: 'Clear, calm seas',
      locationId: locations[4].id,
      userId: guard5.id,
    },

    // === PATROL LOGS ===
    {
      type: 'PATROL',
      title: 'Evening Patrol - All Clear',
      description: 'Completed full perimeter patrol. All docks checked. No suspicious activity.',
      status: 'LIVE',
      locationId: locations[0].id,
      userId: guard1.id,
    },
    {
      type: 'PATROL',
      title: 'Morning Security Check',
      description: 'Inspected all gates, locks, and security equipment. Everything functioning properly.',
      status: 'LIVE',
      locationId: locations[1].id,
      userId: guard2.id,
    },
    {
      type: 'PATROL',
      title: 'Night Patrol Completed',
      description: 'Conducted hourly rounds throughout the night shift. All areas secure.',
      status: 'LIVE',
      locationId: locations[5].id,
      userId: guard6.id,
    },
    {
      type: 'PATROL',
      title: 'Afternoon Dock Inspection',
      description: 'Checked all dock sections, mooring lines, and safety equipment. No issues found.',
      status: 'LIVE',
      locationId: locations[6].id,
      userId: guard7.id,
    },
    {
      type: 'PATROL',
      title: 'Security Perimeter Check',
      description: 'Verified all entry points secured. Checked lighting systems operational.',
      status: 'LIVE',
      locationId: locations[7].id,
      userId: guard8.id,
    },

    // === VISITOR CHECK-INS ===
    {
      type: 'VISITOR_CHECKIN',
      title: 'Marina Tour Group',
      description: 'Checked in group of 15 visitors for scheduled marina tour. Verified all had visitor passes.',
      status: 'LIVE',
      locationId: locations[0].id,
      userId: guard1.id,
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'Fishing Charter Party',
      description: 'Processed check-in for fishing charter group of 8. Verified IDs and collected parking fees.',
      status: 'LIVE',
      locationId: locations[2].id,
      userId: guard9.id,
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'Boat Club Members',
      description: 'Checked in 12 boat club members for scheduled meeting. Directed to conference room.',
      status: 'LIVE',
      locationId: locations[3].id,
      userId: guard10.id,
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'Day Pass Visitors',
      description: 'Issued day passes to 5 visitors. Explained marina rules and safety protocols.',
      status: 'LIVE',
      locationId: locations[4].id,
      userId: guard11.id,
    },

    // === MAINTENANCE LOGS ===
    {
      type: 'MAINTENANCE',
      title: 'Dock Light Malfunction',
      description: 'Three dock lights in section C are not working. Need replacement bulbs or wiring check.',
      status: 'LIVE',
      locationId: locations[3].id,
      userId: guard2.id,
    },
    {
      type: 'MAINTENANCE',
      title: 'Gate Hinge Needs Repair',
      description: 'Main entrance gate is squeaking and difficult to close. Hinges need lubrication or replacement.',
      status: 'ARCHIVED',
      locationId: locations[1].id,
      userId: guard3.id,
      archivedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'MAINTENANCE',
      title: 'Water Pump Issue',
      description: 'Fresh water pump at dock E running but not producing pressure. Requires maintenance.',
      status: 'LIVE',
      locationId: locations[5].id,
      userId: guard12.id,
    },
    {
      type: 'MAINTENANCE',
      title: 'Electrical Outlet Not Working',
      description: 'Power outlet at slip 24 is not functioning. Needs electrical inspection.',
      status: 'LIVE',
      locationId: locations[6].id,
      userId: guard13.id,
    },
    {
      type: 'MAINTENANCE',
      title: 'Handrail Loose',
      description: 'Handrail on ramp to dock B is loose. Safety hazard that needs immediate attention.',
      status: 'LIVE',
      locationId: locations[7].id,
      userId: guard4.id,
    },
    {
      type: 'MAINTENANCE',
      title: 'Restroom Plumbing',
      description: 'Public restroom has leaking faucet. Notified maintenance team.',
      status: 'UPDATED',
      locationId: locations[8].id,
      userId: guard5.id,
    },

    // === WEATHER LOGS ===
    {
      type: 'WEATHER',
      title: 'Storm Watch Alert',
      description: 'National Weather Service issued storm watch. Secured all loose equipment. Advised boat owners.',
      status: 'UPDATED',
      locationId: locations[0].id,
      userId: guard1.id,
    },
    {
      type: 'WEATHER',
      title: 'High Wind Advisory',
      description: 'Winds gusting to 35mph. Checked all mooring lines. Advised smaller vessels to seek shelter.',
      status: 'LIVE',
      locationId: locations[2].id,
      userId: guard6.id,
    },
    {
      type: 'WEATHER',
      title: 'Fog Conditions',
      description: 'Dense fog reducing visibility. Activated fog horns. Extra caution advised for all vessels.',
      status: 'ARCHIVED',
      locationId: locations[3].id,
      userId: guard7.id,
      archivedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'WEATHER',
      title: 'Heat Advisory',
      description: 'Extreme heat conditions. Posted warnings. Ensured water stations stocked and operational.',
      status: 'LIVE',
      locationId: locations[4].id,
      userId: guard8.id,
    },

    // === OTHER LOGS ===
    {
      type: 'OTHER',
      title: 'Lost and Found - Wallet',
      description: 'Found wallet on dock D. Contains ID for local resident. Secured in office.',
      status: 'LIVE',
      locationId: locations[2].id,
      userId: guard3.id,
    },
    {
      type: 'OTHER',
      title: 'Equipment Delivery',
      description: 'Received delivery of new life jackets and safety equipment. Inventory checked and stored.',
      status: 'LIVE',
      locationId: locations[1].id,
      userId: guard9.id,
    },
    {
      type: 'OTHER',
      title: 'Wildlife Observation',
      description: 'Observed seal near dock entrance. Monitored to ensure no interference with operations.',
      status: 'LIVE',
      locationId: locations[5].id,
      userId: guard10.id,
    },
    {
      type: 'OTHER',
      title: 'Lost Child Assistance',
      description: 'Helped reunite lost child with parents. Family was grateful, no incident.',
      status: 'ARCHIVED',
      locationId: locations[0].id,
      userId: guard11.id,
      archivedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      type: 'OTHER',
      title: 'Vendor Access',
      description: 'Escorted maintenance vendor to electrical room for scheduled work.',
      status: 'LIVE',
      locationId: locations[6].id,
      userId: guard12.id,
    },
    {
      type: 'OTHER',
      title: 'Photography Permit',
      description: 'Issued photography permit to professional photographer. Explained restricted areas.',
      status: 'LIVE',
      locationId: locations[7].id,
      userId: guard13.id,
    },
  ]

  // Create all log entries
  for (const entry of logEntries) {
    await prisma.log.create({ data: entry })
  }

  console.log(`✅ Created ${logEntries.length} log entries from all users`)

  // Create additional diverse logs for Jerome (Super Admin)
  console.log('Creating additional logs for Jerome...')

  const jeromeAdditionalLogs = [
    // Day 1 - Recent
    {
      type: 'PATROL',
      title: 'Evening Dock Patrol',
      description: 'Completed routine patrol of all dock areas. All boats secured properly. No issues observed. Weather clear.',
      status: 'LIVE',
      locationId: locations[0].id,
      userId: superAdmin.id,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'Contractor Check-in - Marine Repairs',
      description: 'ABC Marine Services arrived for scheduled repair work on Slip 42. Credentials verified.',
      status: 'LIVE',
      locationId: locations[0].id,
      userId: superAdmin.id,
      peopleInvolved: 'John Smith - ABC Marine Services, License #12345',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000) // 5 hours ago
    },
    {
      type: 'MAINTENANCE',
      title: 'Dock Light Malfunction - Pier C',
      description: 'Three dock lights on Pier C are not functioning. Lights C-12, C-15, and C-18 need bulb replacement or electrical inspection.',
      status: 'LIVE',
      locationId: locations[0].id,
      userId: superAdmin.id,
      followUpRequired: true,
      followUpNotes: 'Maintenance team notified. Scheduled for repair tomorrow morning.',
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000) // 6 hours ago
    },
    {
      type: 'WEATHER',
      title: 'Weather Observation - Strong Winds',
      description: 'Wind speeds increasing. Gusts up to 25-30 mph from northeast. Advising boat owners to check lines and fenders.',
      status: 'LIVE',
      locationId: locations[0].id,
      userId: superAdmin.id,
      weatherConditions: 'Windy, partly cloudy. Temperature 58°F. Wind NE 25-30 mph gusts. Barometer falling.',
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1 hour ago
    },
    {
      type: 'PATROL',
      title: 'Gate Security Check',
      description: 'Verified all pedestrian gates are locked and functioning. Security codes rotated as scheduled.',
      status: 'LIVE',
      locationId: locations[0].id,
      userId: superAdmin.id,
      createdAt: new Date(now.getTime() - 45 * 60 * 1000) // 45 minutes ago
    }
  ]

  for (const logData of jeromeAdditionalLogs) {
    await prisma.log.create({ data: logData })
  }

  console.log('✅ Additional Jerome logs created')

  // Create recent logs from other users (within last 12 hours)
  console.log('Creating recent logs from other users...')

  const recentUserLogs = [
    // James (Guard 1) logs - At Atlantique Marina
    {
      type: 'PATROL',
      title: 'Early Morning Dock Inspection',
      description: 'Completed sunrise patrol of all dock sections. All boats secured, no issues detected. Weather conditions calm.',
      status: 'LIVE',
      locationId: locations[0].id, // Atlantique Marina
      userId: guard1.id,
      createdAt: new Date(now.getTime() - 7 * 60 * 60 * 1000) // 7 hours ago
    },
    {
      type: 'INCIDENT',
      title: 'Boat Taking on Water',
      description: 'Slip owner reported boat taking on water. Assisted in pumping out bilge, identified loose through-hull fitting.',
      status: 'LIVE',
      locationId: locations[0].id, // Atlantique Marina
      userId: guard1.id,
      severity: 'MEDIUM',
      incidentTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      actionsTaken: 'Assisted with bilge pump, helped owner tighten fitting, monitored for 30 minutes',
      peopleInvolved: 'Boat owner: Mark Stevens, Slip A-42',
      followUpRequired: true,
      followUpNotes: 'Owner to have marine mechanic inspect tomorrow',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000) // 5 hours ago
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'Delivery - Marine Supplies',
      description: 'Authorized delivery from Coastal Marine Supply. Driver credentials verified, escorted to dock area.',
      status: 'LIVE',
      locationId: locations[0].id, // Atlantique Marina
      userId: guard1.id,
      peopleInvolved: 'Driver: Tom Brown, Coastal Marine Supply, ID verified',
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000) // 3 hours ago
    },
    // Maria (Guard 2) logs - At Atlantique Marina
    {
      type: 'PATROL',
      title: 'Security Camera System Check',
      description: 'Tested all security cameras and recording systems at Atlantique. All functioning properly.',
      status: 'LIVE',
      locationId: locations[0].id, // Atlantique Marina
      userId: guard2.id,
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000) // 4 hours ago
    },
    {
      type: 'MAINTENANCE',
      title: 'Dock Lighting Issues - Section B',
      description: 'Several dock lights on Pier B not working. Checked breakers, appears to be bulb replacements needed.',
      status: 'LIVE',
      locationId: locations[0].id, // Atlantique Marina
      userId: guard2.id,
      followUpRequired: true,
      followUpNotes: 'Maintenance scheduled to replace bulbs tomorrow morning',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      type: 'WEATHER',
      title: 'Weather Update - Afternoon Conditions',
      description: 'Clear skies, light winds from southwest. Temperature 72°F. Ideal boating conditions at Atlantique.',
      status: 'LIVE',
      locationId: locations[0].id, // Atlantique Marina
      userId: guard2.id,
      weatherConditions: 'Clear, 72°F, SW winds 5-10 mph, excellent visibility',
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1 hour ago
    }
  ]

  for (const logData of recentUserLogs) {
    await prisma.log.create({ data: logData })
  }

  console.log('✅ Recent user logs created')

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

  // Create Safety Checklist Items
  console.log('Creating safety checklist items...')

  const safetyItems = [
    { name: 'Fire Extinguisher', description: 'Check fire extinguisher is present, charged, and accessible', order: 1 },
    { name: 'First Aid Kit', description: 'Verify first aid kit is stocked and in good condition', order: 2 },
    { name: 'Life Jackets', description: 'Confirm life jackets are available and in good condition', order: 3 },
    { name: 'Radio', description: 'Test radio functionality and battery level', order: 4 },
    { name: 'Radio Charger', description: 'Verify radio charger is present and functional', order: 5 },
    { name: 'Fire Exhaust System', description: 'Check fire exhaust/ventilation system is operational', order: 6 },
    { name: 'Emergency Blanket', description: 'Confirm emergency blanket is present and accessible', order: 7 },
    { name: 'Life Preserver Ring and Rope', description: 'Verify life preserver ring and rope are present and in good condition', order: 8 },
  ]

  for (const item of safetyItems) {
    await prisma.safetyChecklistItem.create({
      data: item,
    })
  }

  console.log('✅ Safety checklist items created')

  console.log('🎉 Seed completed successfully!')
  console.log(`
    Created:
    - 21 Users (2 Super Admins, 2 Admins, 4 Supervisors, 13 Guards)
    - 14 Marina Locations (with capacity limits)
    - ${recurringPatterns.length} Recurring Shift Patterns
    - ${shifts.length} Shifts for next 30 days
    - ${shiftAssignments.length} Shift Assignments
    - 4 Duty Sessions (3 active at Atlantique Marina, 1 completed)
      • Jerome (Super Admin), James (Guard 1), Maria (Guard 2) all at Atlantique Marina
    - 2 Location Check-ins
    - ${logEntries.length} Log Entries (incidents, patrols, maintenance, weather, etc. from all users)
      • Location-Based: Multiple logs at Atlantique Marina for on-duty guards
      • Guards only see logs from their current location
      • Admins/Supervisors see all logs in admin interface
    - 3 Assets (boat, vehicle, equipment)
    - 2 Visitors (1 current, 1 checked out)
    - 3 Equipment items (2 checked out, 1 available)
    - 8 Safety Checklist Items (on-duty checklist)
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
