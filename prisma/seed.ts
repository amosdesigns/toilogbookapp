import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data first
  console.log('🧹 Clearing existing data...')
  await prisma.locationCheckIn.deleteMany()
  await prisma.log.deleteMany()
  await prisma.dutySession.deleteMany()
  await prisma.shiftAssignment.deleteMany()
  await prisma.recurringUserAssignment.deleteMany()
  await prisma.shift.deleteMany()
  await prisma.recurringShiftPattern.deleteMany()
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

  // Guard 1 - Currently on duty
  const dutySession1 = await prisma.dutySession.create({
    data: {
      userId: guard1.id,
      locationId: locations[0].id,
      shiftId: todayShifts[0]?.id,
      clockInTime: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      clockOutTime: null, // Still on duty
    },
  })

  // Guard 2 - Currently on duty
  const dutySession2 = await prisma.dutySession.create({
    data: {
      userId: guard2.id,
      locationId: locations[1].id,
      shiftId: todayShifts[1]?.id,
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

  console.log('🎉 Seed completed successfully!')
  console.log(`
    Created:
    - 21 Users (2 Super Admins, 2 Admins, 4 Supervisors, 13 Guards)
    - 14 Marina Locations (with capacity limits)
    - ${recurringPatterns.length} Recurring Shift Patterns
    - ${shifts.length} Shifts for next 30 days
    - ${shiftAssignments.length} Shift Assignments
    - 4 Duty Sessions (3 active, 1 completed)
    - 2 Location Check-ins
    - ${logEntries.length} Log Entries (incidents, patrols, maintenance, weather, etc. from all users)
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
