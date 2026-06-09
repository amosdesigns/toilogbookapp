import 'dotenv/config'
import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'error', 'warn'],
})

async function main() {
  console.log('🌱 Starting minimal database seed (only existing tables)...')

  // Clean existing data
  console.log('🧹 Clearing existing data...')
  await prisma.timesheetAdjustment.deleteMany()
  await prisma.timesheetEntry.deleteMany()
  await prisma.timesheet.deleteMany()
  await prisma.locationCheckIn.deleteMany()
  await prisma.log.deleteMany()
  await prisma.dutySession.deleteMany()
  await prisma.shift.deleteMany()
  await prisma.location.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Database cleared')

  // Create Users
  console.log('Creating users...')

  const userData = [
    // Super Admins (1)
    { clerkId: 'clerk_superadmin_001', email: 'mail@amosdesigns.net', firstName: 'Jerome', lastName: 'Amos', role: 'SUPER_ADMIN' },

    // Admins (3)
    { clerkId: 'clerk_admin_001', email: 'admin1@toi.gov', firstName: 'Sarah', lastName: 'Johnson', role: 'ADMIN' },
    { clerkId: 'clerk_admin_002', email: 'admin2@toi.gov', firstName: 'Michael', lastName: 'Chen', role: 'ADMIN' },
    { clerkId: 'clerk_admin_003', email: 'admin3@toi.gov', firstName: 'Lisa', lastName: 'Rodriguez', role: 'ADMIN' },

    // Supervisors (4)
    { clerkId: 'clerk_supervisor_001', email: 'supervisor1@toi.gov', firstName: 'David', lastName: 'Martinez', role: 'SUPERVISOR' },
    { clerkId: 'clerk_supervisor_002', email: 'supervisor2@toi.gov', firstName: 'Jennifer', lastName: 'Thompson', role: 'SUPERVISOR' },
    { clerkId: 'clerk_supervisor_003', email: 'supervisor3@toi.gov', firstName: 'Robert', lastName: 'Anderson', role: 'SUPERVISOR' },
    { clerkId: 'clerk_supervisor_004', email: 'supervisor4@toi.gov', firstName: 'Emily', lastName: 'White', role: 'SUPERVISOR' },

    // Guards (14)
    { clerkId: 'clerk_guard_001', email: 'guard1@toi.gov', firstName: 'James', lastName: 'Wilson', role: 'GUARD' },
    { clerkId: 'clerk_guard_002', email: 'guard2@toi.gov', firstName: 'Maria', lastName: 'Garcia', role: 'GUARD' },
    { clerkId: 'clerk_guard_003', email: 'guard3@toi.gov', firstName: 'Thomas', lastName: 'Brown', role: 'GUARD' },
    { clerkId: 'clerk_guard_004', email: 'guard4@toi.gov', firstName: 'Patricia', lastName: 'Davis', role: 'GUARD' },
    { clerkId: 'clerk_guard_005', email: 'guard5@toi.gov', firstName: 'Christopher', lastName: 'Miller', role: 'GUARD' },
    { clerkId: 'clerk_guard_006', email: 'guard6@toi.gov', firstName: 'Linda', lastName: 'Moore', role: 'GUARD' },
    { clerkId: 'clerk_guard_007', email: 'guard7@toi.gov', firstName: 'Daniel', lastName: 'Taylor', role: 'GUARD' },
    { clerkId: 'clerk_guard_008', email: 'guard8@toi.gov', firstName: 'Barbara', lastName: 'Jackson', role: 'GUARD' },
    { clerkId: 'clerk_guard_009', email: 'guard9@toi.gov', firstName: 'Matthew', lastName: 'Lee', role: 'GUARD' },
    { clerkId: 'clerk_guard_010', email: 'guard10@toi.gov', firstName: 'Susan', lastName: 'Harris', role: 'GUARD' },
    { clerkId: 'clerk_guard_011', email: 'guard11@toi.gov', firstName: 'Joseph', lastName: 'Clark', role: 'GUARD' },
    { clerkId: 'clerk_guard_012', email: 'guard12@toi.gov', firstName: 'Nancy', lastName: 'Lewis', role: 'GUARD' },
    { clerkId: 'clerk_guard_013', email: 'guard13@toi.gov', firstName: 'Anthony', lastName: 'Walker', role: 'GUARD' },
    { clerkId: 'clerk_guard_014', email: 'guard14@toi.gov', firstName: 'Karen', lastName: 'Hall', role: 'GUARD' },
  ]

  const users: Record<string, {id: string}> = {}

  for (const user of userData) {
    const created = await prisma.user.create({ data: user as any })
    // Store with a simple key like 'superAdmin', 'admin1', 'supervisor1', 'guard1', etc.
    const key = user.role === 'SUPER_ADMIN' ? 'superAdmin' :
                user.role === 'ADMIN' ? `admin${user.email.match(/admin(\d+)/)?.[1]}` :
                user.role === 'SUPERVISOR' ? `supervisor${user.email.match(/supervisor(\d+)/)?.[1]}` :
                `guard${user.email.match(/guard(\d+)/)?.[1]}`
    users[key] = created
  }

  console.log('✅ Created 22 users')

  // Create Locations
  console.log('Creating locations...')

  const locationNames = [
    { name: 'Atlantique Marina', code: 'ATLANTIQUE', maxCapacity: 4 },
    { name: 'Bay Shore Marina', code: 'BAYSHORE', maxCapacity: 3 },
    { name: "Brown's River East Side", code: 'BROWNRIVEREAST', maxCapacity: 3 },
    { name: "Brown's River West Side", code: 'BROWNRIVERWEST', maxCapacity: 3 },
    { name: 'East Islip Marina', code: 'EASTISLIP', maxCapacity: 4 },
    { name: 'Great River Ramp', code: 'GREATRIVER', maxCapacity: 2 },
    { name: 'Homan Creek Dock', code: 'HOMANCREEK', maxCapacity: 2 },
    { name: 'Maple Avenue Dock', code: 'MAPLEAVENUE', maxCapacity: 2 },
    { name: 'Maple Street Dock', code: 'MAPLESTREET', maxCapacity: 2 },
    { name: 'Ocean Avenue Marina', code: 'OCEANAVENUE', maxCapacity: 3 },
    { name: "Port O'Call Marina", code: 'PORTOCALL', maxCapacity: 3 },
    { name: 'Raymond Street Dock', code: 'RAYMONDSTREET', maxCapacity: 2 },
    { name: 'West Avenue Dock', code: 'WESTAVENUE', maxCapacity: 2 },
    { name: 'West Islip Marina', code: 'WESTISLIP', maxCapacity: 4 },
  ]

  const locations = []
  for (const loc of locationNames) {
    const location = await prisma.location.create({
      data: {
        name: loc.name,
        description: `${loc.code} - Marina facility`,
        address: `${loc.name}, Town of Islip, NY`,
        isActive: true,
        maxCapacity: loc.maxCapacity,
      },
    })
    locations.push(location)
  }

  console.log('✅ Created 14 locations')

  // Create Shifts
  console.log('Creating shifts...')
  const now = new Date()

  // Helper function to create date with specific time
  const createShiftTime = (daysOffset: number, hour: number, minute: number = 0) => {
    const date = new Date(now)
    date.setDate(date.getDate() + daysOffset)
    date.setHours(hour, minute, 0, 0)
    return date
  }

  // Past shifts (yesterday)
  const shift1 = await prisma.shift.create({
    data: {
      name: 'Morning Shift - Atlantique Marina',
      startTime: createShiftTime(-1, 7, 0),
      endTime: createShiftTime(-1, 15, 0),
      locationId: locations[0].id, // Atlantique Marina
    },
  })

  const shift2 = await prisma.shift.create({
    data: {
      name: 'Afternoon Shift - Bay Shore Marina',
      startTime: createShiftTime(-1, 15, 0),
      endTime: createShiftTime(-1, 23, 0),
      locationId: locations[1].id, // Bay Shore Marina
    },
  })

  const shift3 = await prisma.shift.create({
    data: {
      name: 'Night Shift - East Islip Marina',
      startTime: createShiftTime(-1, 23, 0),
      endTime: createShiftTime(0, 7, 0),
      locationId: locations[4].id, // East Islip Marina
    },
  })

  // Today's shifts
  const shift4 = await prisma.shift.create({
    data: {
      name: 'Morning Shift - Atlantique Marina',
      startTime: createShiftTime(0, 7, 0),
      endTime: createShiftTime(0, 15, 0),
      locationId: locations[0].id, // Atlantique Marina
    },
  })

  const shift5 = await prisma.shift.create({
    data: {
      name: 'Morning Shift - Bay Shore Marina',
      startTime: createShiftTime(0, 7, 0),
      endTime: createShiftTime(0, 15, 0),
      locationId: locations[1].id, // Bay Shore Marina
    },
  })

  const shift6 = await prisma.shift.create({
    data: {
      name: 'Afternoon Shift - East Islip Marina',
      startTime: createShiftTime(0, 15, 0),
      endTime: createShiftTime(0, 23, 0),
      locationId: locations[4].id, // East Islip Marina
    },
  })

  const shift7 = await prisma.shift.create({
    data: {
      name: 'Afternoon Shift - West Islip Marina',
      startTime: createShiftTime(0, 15, 0),
      endTime: createShiftTime(0, 23, 0),
      locationId: locations[13].id, // West Islip Marina
    },
  })

  // Tomorrow's shifts
  const shift8 = await prisma.shift.create({
    data: {
      name: 'Morning Shift - Atlantique Marina',
      startTime: createShiftTime(1, 7, 0),
      endTime: createShiftTime(1, 15, 0),
      locationId: locations[0].id, // Atlantique Marina
    },
  })

  const shift9 = await prisma.shift.create({
    data: {
      name: 'Morning Shift - Ocean Avenue Marina',
      startTime: createShiftTime(1, 7, 0),
      endTime: createShiftTime(1, 15, 0),
      locationId: locations[9].id, // Ocean Avenue Marina
    },
  })

  const shift10 = await prisma.shift.create({
    data: {
      name: 'Afternoon Shift - Port O\'Call Marina',
      startTime: createShiftTime(1, 15, 0),
      endTime: createShiftTime(1, 23, 0),
      locationId: locations[10].id, // Port O'Call Marina
    },
  })

  const shift11 = await prisma.shift.create({
    data: {
      name: 'Night Shift - Bay Shore Marina',
      startTime: createShiftTime(1, 23, 0),
      endTime: createShiftTime(2, 7, 0),
      locationId: locations[1].id, // Bay Shore Marina
    },
  })

  // Future shifts (2-7 days out)
  const shift12 = await prisma.shift.create({
    data: {
      name: 'Morning Shift - Great River Ramp',
      startTime: createShiftTime(2, 7, 0),
      endTime: createShiftTime(2, 15, 0),
      locationId: locations[5].id, // Great River Ramp
    },
  })

  const shift13 = await prisma.shift.create({
    data: {
      name: 'Weekend Morning - Atlantique Marina',
      startTime: createShiftTime(5, 8, 0),
      endTime: createShiftTime(5, 16, 0),
      locationId: locations[0].id, // Atlantique Marina
    },
  })

  const shift14 = await prisma.shift.create({
    data: {
      name: 'Weekend Afternoon - East Islip Marina',
      startTime: createShiftTime(5, 16, 0),
      endTime: createShiftTime(6, 0, 0),
      locationId: locations[4].id, // East Islip Marina
    },
  })

  const shift15 = await prisma.shift.create({
    data: {
      name: 'Weekend Night - West Islip Marina',
      startTime: createShiftTime(6, 0, 0),
      endTime: createShiftTime(6, 8, 0),
      locationId: locations[13].id, // West Islip Marina
    },
  })

  console.log('✅ Created 15 shifts')

  // Create Shift Assignments
  console.log('Creating shift assignments...')

  // Assign guards to past shifts (completed)
  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift1.id,
      userId: users.guard1.id,
      role: 'PRIMARY',
    },
  })

  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift2.id,
      userId: users.guard2.id,
      role: 'PRIMARY',
    },
  })

  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift3.id,
      userId: users.guard3.id,
      role: 'PRIMARY',
    },
  })

  // Assign guards to today's shifts
  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift4.id,
      userId: users.guard1.id,
      role: 'PRIMARY',
    },
  })

  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift5.id,
      userId: users.guard3.id,
      role: 'PRIMARY',
    },
  })

  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift6.id,
      userId: users.guard5.id,
      role: 'PRIMARY',
    },
  })

  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift7.id,
      userId: users.guard7.id,
      role: 'PRIMARY',
    },
  })

  // Assign guards to tomorrow's shifts
  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift8.id,
      userId: users.guard2.id,
      role: 'PRIMARY',
    },
  })

  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift9.id,
      userId: users.guard4.id,
      role: 'PRIMARY',
    },
  })

  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift10.id,
      userId: users.guard6.id,
      role: 'PRIMARY',
    },
  })

  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift11.id,
      userId: users.guard8.id,
      role: 'PRIMARY',
    },
  })

  // Assign guards to future shifts with backup guards
  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift12.id,
      userId: users.guard9.id,
      role: 'PRIMARY',
    },
  })

  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift12.id,
      userId: users.guard10.id,
      role: 'BACKUP',
    },
  })

  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift13.id,
      userId: users.guard11.id,
      role: 'PRIMARY',
    },
  })

  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift14.id,
      userId: users.guard12.id,
      role: 'PRIMARY',
    },
  })

  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift14.id,
      userId: users.supervisor1.id,
      role: 'SUPERVISOR',
    },
  })

  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift15.id,
      userId: users.guard13.id,
      role: 'PRIMARY',
    },
  })

  await prisma.shiftAssignment.create({
    data: {
      shiftId: shift15.id,
      userId: users.guard14.id,
      role: 'BACKUP',
    },
  })

  console.log('✅ Created 18 shift assignments')

  // Create Duty Sessions
  console.log('Creating duty sessions...')

  // Active duty sessions (guards on duty at various locations)
  await prisma.dutySession.create({
    data: {
      userId: users.guard1.id,
      locationId: locations[0].id, // Atlantique Marina
      clockInTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      clockOutTime: null,
    },
  })

  await prisma.dutySession.create({
    data: {
      userId: users.guard3.id,
      locationId: locations[1].id, // Bay Shore Marina
      clockInTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      clockOutTime: null,
    },
  })

  await prisma.dutySession.create({
    data: {
      userId: users.guard5.id,
      locationId: locations[4].id, // East Islip Marina
      clockInTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      clockOutTime: null,
    },
  })

  await prisma.dutySession.create({
    data: {
      userId: users.guard7.id,
      locationId: locations[13].id, // West Islip Marina
      clockInTime: new Date(now.getTime() - 2.5 * 60 * 60 * 1000),
      clockOutTime: null,
    },
  })

  const supervisorDuty = await prisma.dutySession.create({
    data: {
      userId: users.supervisor1.id,
      locationId: null,
      clockInTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      clockOutTime: null,
    },
  })

  console.log('✅ Created 5 duty sessions')

  // Create Location Check-ins
  console.log('Creating location check-ins...')
  await prisma.locationCheckIn.create({
    data: {
      dutySessionId: supervisorDuty.id,
      locationId: locations[0].id,
      userId: users.supervisor1.id,
      notes: 'All systems operational.',
    },
  })

  await prisma.locationCheckIn.create({
    data: {
      dutySessionId: supervisorDuty.id,
      locationId: locations[1].id,
      userId: users.supervisor1.id,
      notes: 'Checked security cameras and gate locks. Everything secure.',
    },
  })

  console.log('✅ Created 2 location check-ins')

  // Create Logs
  console.log('Creating logs...')

  const logEntries: Prisma.LogUncheckedCreateInput[] = [

    // ===== ATLANTIQUE MARINA (index 0) =====
    {
      type: 'PATROL',
      title: 'Morning Security Rounds',
      description: 'Completed morning patrol of Atlantique Marina. All dock gates secured, no unauthorized vessels observed. Slip areas clear and free of debris.',
      status: 'LIVE',
      locationId: locations[0].id,
      userId: users.guard1.id,
      createdAt: new Date(now.getTime() - 68 * 60 * 60 * 1000),
    },
    {
      type: 'INCIDENT',
      title: 'Suspicious Vessel Observed',
      description: 'Unregistered vessel anchored approximately 50 yards off the dock without valid display of registration. Owner was unable to produce required documentation when approached.',
      status: 'UPDATED',
      severity: 'MEDIUM',
      locationId: locations[0].id,
      userId: users.guard2.id,
      incidentTime: new Date(now.getTime() - 50 * 60 * 60 * 1000),
      actionsTaken: 'Vessel operator was advised of registration requirements and directed to depart. NY State Marine Police notified via radio. Incident logged per protocol.',
      followUpRequired: true,
      reviewedBy: users.supervisor1.id,
      reviewedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      reviewNotes: 'Confirmed notification to Marine Police. Patrol frequency increased around outer dock for remainder of shift.',
      createdAt: new Date(now.getTime() - 50 * 60 * 60 * 1000),
    },
    {
      type: 'WEATHER',
      title: 'Pre-Storm Vessel Tie-Down Check',
      description: 'NWS issued small craft advisory for Great South Bay. Verified all slips 1–32 have double tie-downs. Informed three slip holders via phone. Posted advisory notices at dock entrance.',
      status: 'LIVE',
      locationId: locations[0].id,
      userId: users.guard1.id,
      createdAt: new Date(now.getTime() - 30 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Supervisor Rounds — Atlantique',
      description: 'Conducted supervisor inspection of Atlantique Marina. Reviewed guard logbook, verified post coverage, checked emergency equipment stations. All items accounted for and operational.',
      status: 'LIVE',
      locationId: locations[0].id,
      userId: users.supervisor1.id,
      createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
    },
    {
      type: 'OTHER',
      title: 'NYS Parks Inspector Visit',
      description: 'NYS Office of Parks, Recreation and Historic Preservation inspector conducted annual compliance review. Facility passed all safety and environmental criteria. Copy of inspection report filed in office.',
      status: 'LIVE',
      locationId: locations[0].id,
      userId: users.admin1.id,
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },

    // ===== BAY SHORE MARINA (index 1) =====
    {
      type: 'PATROL',
      title: 'Evening Perimeter Check',
      description: 'Completed full perimeter walk of Bay Shore Marina. All lighting functional, parking lot clear. Discovered loose hinge on the north secondary gate — maintenance work order submitted.',
      status: 'LIVE',
      locationId: locations[1].id,
      userId: users.guard3.id,
      createdAt: new Date(now.getTime() - 66 * 60 * 60 * 1000),
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'Marine Contractor Access',
      description: 'Aquatech Marine Services contractor arrived to perform scheduled bilge pump service on Town vessel. ID verified, contractor log signed. Work completed and contractor departed at 14:30.',
      status: 'LIVE',
      locationId: locations[1].id,
      userId: users.guard4.id,
      createdAt: new Date(now.getTime() - 46 * 60 * 60 * 1000),
    },
    {
      type: 'MAINTENANCE',
      title: 'Life Ring Station Inspection',
      description: 'Inspected all six life ring stations. Two rings showed UV deterioration; replaced from supply room stock. Throw bags re-coiled and returned to mounts. All stations now compliant.',
      status: 'LIVE',
      locationId: locations[1].id,
      userId: users.guard3.id,
      createdAt: new Date(now.getTime() - 28 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Supervisor Inspection — Bay Shore',
      description: 'Reviewed on-duty guard roster and shift log. Conducted dock walk with Guard Davis. No safety violations. Signage at entrance updated to reflect current season hours.',
      status: 'LIVE',
      locationId: locations[1].id,
      userId: users.supervisor2.id,
      createdAt: new Date(now.getTime() - 18 * 60 * 60 * 1000),
    },
    {
      type: 'OTHER',
      title: 'Guard Certification Records Audit',
      description: 'Conducted quarterly review of guard certifications for Bay Shore Marina staff. All assigned personnel have current CPR/AED, Lifeguard, and Water Safety certifications on file. Renewals due in 90 days for two guards — notifications sent.',
      status: 'LIVE',
      locationId: locations[1].id,
      userId: users.admin2.id,
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },

    // ===== BROWN'S RIVER EAST SIDE (index 2) =====
    {
      type: 'PATROL',
      title: 'Early Morning Dock Patrol',
      description: 'Pre-dawn patrol of Brown\'s River East Side dock. All vessels secure. Noted one boat with running lights left on; owner contacted via slip registration and advised.',
      status: 'LIVE',
      locationId: locations[2].id,
      userId: users.guard5.id,
      createdAt: new Date(now.getTime() - 71 * 60 * 60 * 1000),
    },
    {
      type: 'INCIDENT',
      title: 'Minor Fuel Spill at Fuel Dock',
      description: 'Approximately 1–2 gallons of marine diesel spilled during fuel transfer by slip holder at Pump #2. Immediate containment with oil-absorbent boom deployed.',
      status: 'UPDATED',
      severity: 'LOW',
      locationId: locations[2].id,
      userId: users.guard6.id,
      incidentTime: new Date(now.getTime() - 55 * 60 * 60 * 1000),
      peopleInvolved: 'Slip holder: Frank Deluca (Slip 8B)',
      actionsTaken: 'Oil-absorbent pads deployed, containment boom placed. Area secured. DEC Spill Hotline notified per protocol. Environmental contractor standing by.',
      followUpRequired: true,
      reviewedBy: users.supervisor3.id,
      reviewedAt: new Date(now.getTime() - 53 * 60 * 60 * 1000),
      reviewNotes: 'DEC spill report #TOI-2024-0412 filed. Fuel dock pump #2 taken offline pending inspection.',
      createdAt: new Date(now.getTime() - 55 * 60 * 60 * 1000),
    },
    {
      type: 'WEATHER',
      title: 'High Wind & Wave Conditions',
      description: 'Sustained winds of 22 mph from WSW with gusts to 35 mph recorded at dock anemometer. Waves in Brown\'s River estimated at 2–3 ft. All vessels in slips verified secure; additional spring lines recommended to three boats.',
      status: 'LIVE',
      locationId: locations[2].id,
      userId: users.guard5.id,
      createdAt: new Date(now.getTime() - 35 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Supervisor Rounds — Brown\'s River East',
      description: 'Supervisor check-in at Brown\'s River East Side. Reviewed fuel spill follow-up status with on-duty guard. Environmental contractor completed cleanup; area cleared. Patrol log reviewed and initialed.',
      status: 'LIVE',
      locationId: locations[2].id,
      userId: users.supervisor3.id,
      createdAt: new Date(now.getTime() - 22 * 60 * 60 * 1000),
    },
    {
      type: 'MAINTENANCE',
      title: 'Dock Equipment Inventory Audit',
      description: 'Admin-directed audit of dock equipment at Brown\'s River East. Inventoried: 6 life rings, 4 throw bags, 2 fire extinguishers, 1 AED unit. AED battery replaced and unit tested. Inventory sheet submitted to office.',
      status: 'LIVE',
      locationId: locations[2].id,
      userId: users.admin3.id,
      createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },

    // ===== BROWN'S RIVER WEST SIDE (index 3) =====
    {
      type: 'PATROL',
      title: 'Overnight Patrol — West Dock',
      description: 'Completed overnight security patrol of Brown\'s River West Side. No vessels moored after hours without permits. Dock lights all operational. Gate padlocks checked and secured.',
      status: 'LIVE',
      locationId: locations[3].id,
      userId: users.guard7.id,
      createdAt: new Date(now.getTime() - 63 * 60 * 60 * 1000),
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'Overnight Transient Dockage',
      description: 'Vessel "Summer Breeze" (27 ft. Wellcraft, registration NY-4412-RB) requested overnight transient dockage. Owner ID verified; transient dockage fee collected. Vessel assigned to T-Dock slip 4.',
      status: 'LIVE',
      locationId: locations[3].id,
      userId: users.guard8.id,
      createdAt: new Date(now.getTime() - 44 * 60 * 60 * 1000),
    },
    {
      type: 'INCIDENT',
      title: 'Trespassing — After-Hours Fishing',
      description: 'Two individuals found fishing from dock after posted closing hours (10:00 PM). Area was locked but individuals had climbed fence at the south end.',
      status: 'UPDATED',
      severity: 'MEDIUM',
      locationId: locations[3].id,
      userId: users.guard7.id,
      incidentTime: new Date(now.getTime() - 29 * 60 * 60 * 1000),
      peopleInvolved: 'Two adult males, declined to provide identification',
      actionsTaken: 'Individuals asked to leave. They complied after brief verbal exchange. Suffolk County PD notified; officers arrived and issued verbal warning. Fence breach location noted for maintenance.',
      followUpRequired: true,
      reviewedBy: users.supervisor4.id,
      reviewedAt: new Date(now.getTime() - 27 * 60 * 60 * 1000),
      reviewNotes: 'Maintenance work order submitted for south fence repair. Recommend temporary lighting addition at breach location.',
      createdAt: new Date(now.getTime() - 29 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Supervisor Rounds — Brown\'s River West',
      description: 'Verified fence breach at south end has been flagged for maintenance. Spoke with on-duty guard regarding trespass incident from previous shift. Patrol coverage schedule adjusted.',
      status: 'LIVE',
      locationId: locations[3].id,
      userId: users.supervisor4.id,
      createdAt: new Date(now.getTime() - 17 * 60 * 60 * 1000),
    },
    {
      type: 'OTHER',
      title: 'Signage & Regulatory Review',
      description: 'Reviewed all posted signs at Brown\'s River West Side per Town of Islip code compliance requirements. Replaced two faded no-wake zone signs and one outdated hours-of-operation placard. Updated contact information placard installed at main entrance.',
      status: 'LIVE',
      locationId: locations[3].id,
      userId: users.admin1.id,
      createdAt: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },

    // ===== EAST ISLIP MARINA (index 4) =====
    {
      type: 'PATROL',
      title: 'Morning Dock Sweep',
      description: 'Conducted full dock inspection at East Islip Marina at start of shift. All 48 slips accounted for. One boat with fraying dock line — slip holder notified to replace by end of day.',
      status: 'LIVE',
      locationId: locations[4].id,
      userId: users.guard9.id,
      createdAt: new Date(now.getTime() - 70 * 60 * 60 * 1000),
    },
    {
      type: 'MAINTENANCE',
      title: 'Safety Equipment Weekly Check',
      description: 'Performed weekly inspection of all safety equipment stations: life rings inspected (8 of 8 acceptable), fire extinguishers tagged and dated (all current), AED unit tested functional, first aid kits restocked. Eyewash station flushed.',
      status: 'LIVE',
      locationId: locations[4].id,
      userId: users.guard10.id,
      createdAt: new Date(now.getTime() - 50 * 60 * 60 * 1000),
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'Seasonal Slip Holder Annual Check-In',
      description: 'Processed annual seasonal slip renewal paperwork for 4 slip holders who arrived for the new season. Verified current registration, insurance, and emergency contact information for each vessel. Issued updated dock access tags.',
      status: 'LIVE',
      locationId: locations[4].id,
      userId: users.guard9.id,
      createdAt: new Date(now.getTime() - 32 * 60 * 60 * 1000),
    },
    {
      type: 'INCIDENT',
      title: 'Slip Holder Vehicle Break-In',
      description: 'Slip holder reported vehicle broken into in the upper parking lot while they were aboard their vessel. Vehicle window smashed; bag and electronics reported stolen.',
      status: 'UPDATED',
      severity: 'HIGH',
      locationId: locations[4].id,
      userId: users.supervisor1.id,
      incidentTime: new Date(now.getTime() - 20 * 60 * 60 * 1000),
      peopleInvolved: 'Victim: Alan Breslin (Slip 22, 2019 Jeep Grand Cherokee NY plate HJK-3341)',
      witnesses: 'Slip holder in adjacent space (Slip 21)',
      actionsTaken: 'Suffolk County PD called, arrived within 12 minutes. Police report #SCF-2024-98871 filed. Parking lot security camera footage preserved and copied to USB for investigators.',
      followUpRequired: true,
      reviewedBy: users.supervisor1.id,
      reviewedAt: new Date(now.getTime() - 19 * 60 * 60 * 1000),
      reviewNotes: 'Parking lot cameras reviewed — suspect captured on cam B3. Footage submitted to SCPD. Recommend additional lighting in upper lot.',
      createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
    },
    {
      type: 'OTHER',
      title: 'Seasonal Slip Permit Audit',
      description: 'Completed admin review of all 48 East Islip Marina slip permits. 44 current and valid. 3 pending renewal notices sent. 1 slip vacancy posted on Town website. Updated master permit list submitted to Town Hall records office.',
      status: 'LIVE',
      locationId: locations[4].id,
      userId: users.admin2.id,
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },

    // ===== GREAT RIVER RAMP (index 5) =====
    {
      type: 'PATROL',
      title: 'Boat Ramp Opening Inspection',
      description: 'Conducted start-of-day inspection of Great River Ramp. Ramp surface clear of debris. Floating dock guide secured. No vehicles parked overnight in launch lot. Launch fee box verified.',
      status: 'LIVE',
      locationId: locations[5].id,
      userId: users.guard11.id,
      createdAt: new Date(now.getTime() - 67 * 60 * 60 * 1000),
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'Kayak Club Group Launch',
      description: 'Great South Bay Paddlers kayak club (12 members) used boat ramp for organized group launch. Club permit #GSBP-2024-07 verified. Signed group liability waiver collected. All participants wearing PFDs confirmed.',
      status: 'LIVE',
      locationId: locations[5].id,
      userId: users.guard12.id,
      createdAt: new Date(now.getTime() - 47 * 60 * 60 * 1000),
    },
    {
      type: 'WEATHER',
      title: 'Low Tide Ramp Access Advisory',
      description: 'Extreme low tide (-0.4 ft MLLW) rendered lower ramp section inaccessible for trailered vessels drawing more than 24 inches. Posted temporary advisory sign at ramp head. Advised 6 boat owners attempting to launch to return at high tide (14:20).',
      status: 'LIVE',
      locationId: locations[5].id,
      userId: users.guard11.id,
      createdAt: new Date(now.getTime() - 34 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Supervisor Rounds — Great River',
      description: 'Checked in at Great River Ramp. Reviewed launch log — 23 vessel launches logged for the day. Ramp condition excellent. Confirmed low tide advisory posting. Reminded guard to document all groups of 5+ in visitor log.',
      status: 'LIVE',
      locationId: locations[5].id,
      userId: users.supervisor2.id,
      createdAt: new Date(now.getTime() - 19 * 60 * 60 * 1000),
    },
    {
      type: 'MAINTENANCE',
      title: 'Ramp Algae & Debris Removal',
      description: 'Coordinated with DPW crew for quarterly pressure washing of ramp surface. Algae growth on lower 20 ft of ramp cleared. Floating guide dock restraint cables inspected and retensioned. Ramp reopened to normal use.',
      status: 'LIVE',
      locationId: locations[5].id,
      userId: users.admin3.id,
      createdAt: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    },

    // ===== HOMAN CREEK DOCK (index 6) =====
    {
      type: 'PATROL',
      title: 'Midday Dock Patrol',
      description: 'Routine midday patrol of Homan Creek Dock. All 16 vessels in slips accounted for. Dock walkway clear. No unauthorized access. Noted one vessel with expired parking permit — notice placed on windshield.',
      status: 'LIVE',
      locationId: locations[6].id,
      userId: users.guard13.id,
      createdAt: new Date(now.getTime() - 65 * 60 * 60 * 1000),
    },
    {
      type: 'MAINTENANCE',
      title: 'Dock Cleat & Line Hardware Inspection',
      description: 'Inspected all dock cleats, dock box hardware, and utility pedestals along Homan Creek Dock. Found two cleats with stripped bolts on section C — replaced with stainless hardware from supplies. Noted 3 pedestals with corroded outlets; submitted electrical work order.',
      status: 'LIVE',
      locationId: locations[6].id,
      userId: users.guard14.id,
      createdAt: new Date(now.getTime() - 45 * 60 * 60 * 1000),
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'After-Hours Emergency Dockage Request',
      description: 'Vessel owner called requesting emergency dockage after experiencing engine trouble returning from Great South Bay. Verified membership and contacted on-call supervisor for approval. Vessel safely docked at Guest Dock B at 21:45.',
      status: 'LIVE',
      locationId: locations[6].id,
      userId: users.guard13.id,
      createdAt: new Date(now.getTime() - 27 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Supervisor Check-In — Homan Creek',
      description: 'Reviewed maintenance work orders submitted this week. Confirmed electrical work order for corroded pedestals has been assigned to Town electrician (WO #2024-1143). Patrol log initialed. Dock capacity at 87%.',
      status: 'LIVE',
      locationId: locations[6].id,
      userId: users.supervisor3.id,
      createdAt: new Date(now.getTime() - 15 * 60 * 60 * 1000),
    },
    {
      type: 'OTHER',
      title: 'Marina Capacity & Utilization Review',
      description: 'Compiled monthly capacity utilization report for Homan Creek Dock. Current occupancy: 14 of 16 slips (87.5%). Two slips available; posted on Town marina availability board. Revenue summary submitted to Finance.',
      status: 'LIVE',
      locationId: locations[6].id,
      userId: users.admin1.id,
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },

    // ===== MAPLE AVENUE DOCK (index 7) =====
    {
      type: 'PATROL',
      title: 'End-of-Shift Security Walkthrough',
      description: 'End-of-shift patrol of Maple Avenue Dock. All vessels secure. Parking lot cleared. Gate at east entrance locked and chained. Dock lights tested — light #4 has a flickering issue; work order submitted.',
      status: 'LIVE',
      locationId: locations[7].id,
      userId: users.guard1.id,
      createdAt: new Date(now.getTime() - 60 * 60 * 1000 * 62),
    },
    {
      type: 'INCIDENT',
      title: 'Slip Assignment Dispute',
      description: 'Two seasonal slip holders disputed occupancy of Slip 12. Both claimed prior verbal authorization from previous staff. Dispute became heated, required de-escalation.',
      status: 'UPDATED',
      severity: 'LOW',
      locationId: locations[7].id,
      userId: users.guard2.id,
      incidentTime: new Date(now.getTime() - 43 * 60 * 60 * 1000),
      peopleInvolved: 'Raymond Foley (Slip 12 current holder) and Steven Cruz (claimant)',
      actionsTaken: 'Both parties separated and directed to marina office. Slip assignment records reviewed. Confirmed Foley holds valid permit. Cruz directed to contact admin for slip waiting list.',
      followUpRequired: false,
      reviewedBy: users.supervisor4.id,
      reviewedAt: new Date(now.getTime() - 42 * 60 * 60 * 1000),
      reviewNotes: 'Confirmed via permit records. No further action needed. Guard handled situation appropriately.',
      createdAt: new Date(now.getTime() - 43 * 60 * 60 * 1000),
    },
    {
      type: 'WEATHER',
      title: 'Dense Fog Advisory — Vessel Operations',
      description: 'Dense fog reducing visibility to under 200 yards reported. Posted fog advisory at dock entrance. Advised three departing vessels of conditions and recommended delay. Two captains heeded advisory; one departed with horn and radar active.',
      status: 'LIVE',
      locationId: locations[7].id,
      userId: users.guard1.id,
      createdAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Supervisor Evening Rounds — Maple Ave',
      description: 'Evening rounds at Maple Avenue Dock. Reviewed slip dispute incident from earlier shift. All guard logs reviewed. Dock lighting work order confirmed submitted for flickering light #4.',
      status: 'LIVE',
      locationId: locations[7].id,
      userId: users.supervisor4.id,
      createdAt: new Date(now.getTime() - 14 * 60 * 60 * 1000),
    },
    {
      type: 'OTHER',
      title: 'Staff Coverage Schedule Update',
      description: 'Updated guard coverage schedule for Maple Avenue Dock for the upcoming two-week period. Adjusted shift assignments to account for upcoming holiday weekend — added additional coverage Saturday and Sunday 12:00–20:00. Schedule posted and distributed to all assigned staff.',
      status: 'LIVE',
      locationId: locations[7].id,
      userId: users.admin2.id,
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },

    // ===== MAPLE STREET DOCK (index 8) =====
    {
      type: 'PATROL',
      title: 'Perimeter & Dock Inspection',
      description: 'Conducted perimeter check of Maple Street Dock. Fencing intact. Dock bumpers checked — two sections on the south float need replacement. Vessel count: 11 vessels in residence, all with current permits displayed.',
      status: 'LIVE',
      locationId: locations[8].id,
      userId: users.guard3.id,
      createdAt: new Date(now.getTime() - 69 * 60 * 60 * 1000),
    },
    {
      type: 'MAINTENANCE',
      title: 'Dock Lighting System Check',
      description: 'Conducted full dock lighting inspection per monthly maintenance schedule. Tested all 18 dock light fixtures. Replaced bulbs in fixtures #3, #9, and #14. Verified timer settings for seasonal hours. All systems operational.',
      status: 'LIVE',
      locationId: locations[8].id,
      userId: users.guard4.id,
      createdAt: new Date(now.getTime() - 49 * 60 * 60 * 1000),
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'Overnight Transient Dockage — Permitted',
      description: 'Vessel "Lady Luck" (32 ft. Carver, NY reg. HLQ-9921) requested overnight transient dockage. Owner documentation verified; transient fee paid. Vessel assigned Guest Slip A. Departure scheduled for 08:00 following morning.',
      status: 'LIVE',
      locationId: locations[8].id,
      userId: users.guard3.id,
      createdAt: new Date(now.getTime() - 31 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Supervisor Facility Walkthrough — Maple St',
      description: 'Full facility walkthrough including dock, parking, and utility building. Reviewed maintenance log; dock bumper replacement work order noted. Spoke with on-duty guard. No safety violations. Emergency equipment stations satisfactory.',
      status: 'LIVE',
      locationId: locations[8].id,
      userId: users.supervisor1.id,
      createdAt: new Date(now.getTime() - 16 * 60 * 60 * 1000),
    },
    {
      type: 'OTHER',
      title: 'Security Camera System Audit',
      description: 'Performed admin review of camera coverage at Maple Street Dock. Reviewed 30-day footage retention compliance. Camera C2 (parking entrance) has a blind spot due to overgrown vegetation — landscaping work order submitted. All footage storage confirmed compliant.',
      status: 'LIVE',
      locationId: locations[8].id,
      userId: users.admin3.id,
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },

    // ===== OCEAN AVENUE MARINA (index 9) =====
    {
      type: 'PATROL',
      title: 'Morning Dock and Parking Sweep',
      description: 'Opening patrol of Ocean Avenue Marina. Dock surface clear, all vessels with current permits. Two vehicles in overnight parking without permit — notices placed on windshields. Trash receptacles emptied.',
      status: 'LIVE',
      locationId: locations[9].id,
      userId: users.guard5.id,
      createdAt: new Date(now.getTime() - 64 * 60 * 60 * 1000),
    },
    {
      type: 'INCIDENT',
      title: 'Theft of Outboard Motor',
      description: 'Slip holder reported outboard motor stolen from vessel overnight. Motor (Yamaha 115 HP, SN Y2022-441873) was on vessel when owner departed previous evening.',
      status: 'UPDATED',
      severity: 'HIGH',
      locationId: locations[9].id,
      userId: users.guard6.id,
      incidentTime: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      peopleInvolved: 'Victim: Carol Wheaton (Slip 17, vessel "Sea Glass")',
      witnesses: 'None identified',
      actionsTaken: 'SCPD called, report filed (#SCF-2024-99134). Dock camera footage from 21:00–06:00 preserved. Motor serial number provided to police. Dock entry log reviewed — no unauthorized entry cards used.',
      followUpRequired: true,
      reviewedBy: users.supervisor2.id,
      reviewedAt: new Date(now.getTime() - 46 * 60 * 60 * 1000),
      reviewNotes: 'Camera footage shows individual on dock at 02:17 — does not appear to use gate access (possible fence entry). SCPD detective requested footage copy.',
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'Routine Inspection — DEC Officer',
      description: 'NYS DEC Environmental Conservation Officer conducted routine boat registration and safety compliance inspection of vessels at Ocean Avenue Marina. Guard accompanied officer during dock walk. No violations noted.',
      status: 'LIVE',
      locationId: locations[9].id,
      userId: users.guard5.id,
      createdAt: new Date(now.getTime() - 28 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Incident Follow-Up Patrol — Ocean Ave',
      description: 'Increased patrol frequency following motor theft incident. Added 02:00 and 04:00 dock checks. Reviewed dock access fencing for breach points — found gap in south perimeter chainlink. Maintenance work order submitted. Temporary barrier installed.',
      status: 'LIVE',
      locationId: locations[9].id,
      userId: users.supervisor2.id,
      createdAt: new Date(now.getTime() - 13 * 60 * 60 * 1000),
    },
    {
      type: 'OTHER',
      title: 'Physical Security Assessment',
      description: 'Conducted administrative security vulnerability assessment following theft incident. Identified three access improvement opportunities: (1) extend perimeter fencing at south boundary, (2) add motion-activated lighting near dock access gates, (3) upgrade to keycard system with audit logging. Recommendations report submitted to Town facilities management.',
      status: 'LIVE',
      locationId: locations[9].id,
      userId: users.admin1.id,
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },

    // ===== PORT O'CALL MARINA (index 10) =====
    {
      type: 'PATROL',
      title: 'Afternoon Dock and Lot Patrol',
      description: 'Completed afternoon security patrol of Port O\'Call Marina. All dock sections clear and secure. Fuel dock area clean. Monitored heavy boat traffic from afternoon fishing charter returns. No incidents.',
      status: 'LIVE',
      locationId: locations[10].id,
      userId: users.guard7.id,
      createdAt: new Date(now.getTime() - 61 * 60 * 60 * 1000),
    },
    {
      type: 'MAINTENANCE',
      title: 'Monthly Fire Extinguisher Inspection',
      description: 'Completed monthly inspection of all fire extinguishers at Port O\'Call Marina: dock, fuel dock, and utility building locations. All 8 units show full charge and current annual inspection tags. One unit within 2 months of service date — tagged for priority service. Documentation filed.',
      status: 'LIVE',
      locationId: locations[10].id,
      userId: users.guard8.id,
      createdAt: new Date(now.getTime() - 41 * 60 * 60 * 1000),
    },
    {
      type: 'WEATHER',
      title: 'Tropical Storm Watch — Vessel Preparedness',
      description: 'NWS issued Tropical Storm Watch for coastal Suffolk County. All 36 slip holders contacted by phone regarding vessel preparedness. 28 owners responded and added extra lines. 8 owners unreachable — guards added additional dock lines to unattended vessels as precaution.',
      status: 'LIVE',
      locationId: locations[10].id,
      userId: users.guard7.id,
      createdAt: new Date(now.getTime() - 23 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Supervisor Pre-Storm Rounds — Port O\'Call',
      description: 'Pre-storm supervisor inspection in advance of Tropical Storm Watch. Verified vessel tie-downs reviewed by guard, checked that fuel dock is secured and fuel delivery stopped. Emergency contacts list updated. Storm protocols activated — marina to reduce visitor access.',
      status: 'LIVE',
      locationId: locations[10].id,
      userId: users.supervisor3.id,
      createdAt: new Date(now.getTime() - 11 * 60 * 60 * 1000),
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'Town Facilities Inspector Site Visit',
      description: 'Town of Islip Facilities Inspector (Jim Caruso) visited Port O\'Call Marina for annual dock structure inspection. Guard accompanied inspector. Dock structure rated satisfactory. Minor planking replacement recommended for section E-4 through E-7. Report expected within 30 days.',
      status: 'LIVE',
      locationId: locations[10].id,
      userId: users.admin2.id,
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },

    // ===== RAYMOND STREET DOCK (index 11) =====
    {
      type: 'PATROL',
      title: 'Night Patrol — Raymond Street',
      description: 'Completed 23:00 night patrol of Raymond Street Dock. All vessels secured. Dock lighting functional. Parking area clear. One vessel with no running lights left on — note placed on windshield of vessel owner\'s registered vehicle.',
      status: 'LIVE',
      locationId: locations[11].id,
      userId: users.guard9.id,
      createdAt: new Date(now.getTime() - 59 * 60 * 60 * 1000),
    },
    {
      type: 'INCIDENT',
      title: 'Suspicious Person Loitering',
      description: 'Individual observed sitting on dock benches for over 90 minutes after posted hours. Did not have valid marina access. Became verbally agitated when asked to leave.',
      status: 'UPDATED',
      severity: 'LOW',
      locationId: locations[11].id,
      userId: users.guard10.id,
      incidentTime: new Date(now.getTime() - 40 * 60 * 60 * 1000),
      peopleInvolved: 'One adult male, appeared to be in mid-40s, blue jacket',
      actionsTaken: 'Guard approached, identified self, and requested individual vacate the premises. Individual left after second request. SCPD non-emergency line informed as precaution.',
      followUpRequired: false,
      reviewedBy: users.supervisor4.id,
      reviewedAt: new Date(now.getTime() - 39 * 60 * 60 * 1000),
      reviewNotes: 'No further action required. Guard followed de-escalation protocol correctly.',
      createdAt: new Date(now.getTime() - 40 * 60 * 60 * 1000),
    },
    {
      type: 'MAINTENANCE',
      title: 'Main Gate Lock Replacement Request',
      description: 'Main entry gate padlock at Raymond Street Dock has a broken key retention mechanism — key difficult to remove after locking. Temporary padlock installed from supply room. Formal replacement work order submitted (#WO-2024-1189).',
      status: 'LIVE',
      locationId: locations[11].id,
      userId: users.guard9.id,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Supervisor Rounds — Raymond Street',
      description: 'Check-in at Raymond Street Dock. Reviewed recent suspicious person incident; confirmed guard followed protocol. Verified temporary padlock installation at main gate. Confirmed work order submitted. No other issues.',
      status: 'LIVE',
      locationId: locations[11].id,
      userId: users.supervisor4.id,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      type: 'OTHER',
      title: 'Annual Facility Review — Raymond Street',
      description: 'Completed annual administrative facility review for Raymond Street Dock. Reviewed permit records, maintenance logs, incident reports, and staff certifications. All records in order. Identified need for updated dock map at entrance kiosk — new map to be printed and installed within 30 days.',
      status: 'LIVE',
      locationId: locations[11].id,
      userId: users.admin3.id,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },

    // ===== WEST AVENUE DOCK (index 12) =====
    {
      type: 'PATROL',
      title: 'Dock Opening Inspection',
      description: 'Start-of-day inspection of West Avenue Dock. Dock surface debris cleared from overnight windstorm. All vessels secure. Noted one cleat pulled from decking near slip 6 — caution tape placed; work order filed.',
      status: 'LIVE',
      locationId: locations[12].id,
      userId: users.guard11.id,
      createdAt: new Date(now.getTime() - 57 * 60 * 60 * 1000),
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'Kayak & Paddleboard Launch',
      description: 'Processed group of 8 kayak and paddleboard users launching from West Avenue Dock public access area. Verified all participants had PFDs; two individuals without whistles — spares provided from dock box. Waiver forms completed and filed.',
      status: 'LIVE',
      locationId: locations[12].id,
      userId: users.guard12.id,
      createdAt: new Date(now.getTime() - 37 * 60 * 60 * 1000),
    },
    {
      type: 'WEATHER',
      title: 'Lightning Advisory — Dock Closure',
      description: 'National Weather Service issued lightning advisory for the area. Per safety protocol, dock closed to new activity at 14:35. Advised all active paddlers and boaters to return to dock or find shelter. Dock reopened at 16:10 following all-clear.',
      status: 'LIVE',
      locationId: locations[12].id,
      userId: users.guard11.id,
      createdAt: new Date(now.getTime() - 21 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Supervisor Rounds — West Avenue',
      description: 'Checked in at West Avenue Dock. Reviewed lightning closure incident; guard followed protocol correctly. Verified cleat damage at Slip 6 has caution tape and work order. Capacity appears high on weekends — noted for scheduling review.',
      status: 'LIVE',
      locationId: locations[12].id,
      userId: users.supervisor1.id,
      createdAt: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    },
    {
      type: 'MAINTENANCE',
      title: 'Dock Safety Inspection — Admin Directed',
      description: 'Completed admin-directed structural safety walk of West Avenue Dock following windstorm event. Identified: 1 pulled cleat (Slip 6, work order filed), 2 dock sections with hairline cracks (non-structural, monitor), all dock box lids intact. Full report submitted to facilities management.',
      status: 'LIVE',
      locationId: locations[12].id,
      userId: users.admin1.id,
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },

    // ===== WEST ISLIP MARINA (index 13) =====
    {
      type: 'PATROL',
      title: 'Morning Security Patrol',
      description: 'Completed morning patrol of West Islip Marina. All 40 slips accounted for with permits. Dock walkways clear. No unauthorized vehicles in lot. One trailer improperly parked blocking launch lane — owner identified and moved trailer.',
      status: 'LIVE',
      locationId: locations[13].id,
      userId: users.guard13.id,
      createdAt: new Date(now.getTime() - 58 * 60 * 60 * 1000),
    },
    {
      type: 'INCIDENT',
      title: 'Boat Engine Cover Damage Reported',
      description: 'Slip holder found engine cover on their vessel cracked and partially displaced. Vessel had been unoccupied for 4 days. Damage does not appear accidental — possible vandalism.',
      status: 'UPDATED',
      severity: 'MEDIUM',
      locationId: locations[13].id,
      userId: users.guard14.id,
      incidentTime: new Date(now.getTime() - 38 * 60 * 60 * 1000),
      peopleInvolved: 'Vessel owner: Timothy Walsh (Slip 31, vessel "Knot on Call")',
      witnesses: 'None identified',
      actionsTaken: 'SCPD notified, report filed (#SCF-2024-99278). Dock camera footage from 3-day period preserved and reviewed. Area patrol increased. Owner given incident report number for insurance purposes.',
      followUpRequired: true,
      reviewedBy: users.supervisor2.id,
      reviewedAt: new Date(now.getTime() - 37 * 60 * 60 * 1000),
      reviewNotes: 'Camera footage inconclusive due to angle limitation at Slip 31. SCPD has copy of available footage. Recommend repositioning camera C4 in next maintenance cycle.',
      createdAt: new Date(now.getTime() - 38 * 60 * 60 * 1000),
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'US Coast Guard Auxiliary Facility Check',
      description: 'USCG Auxiliary Flotilla 12-3 conducted routine marina facility safety check. Guard escorted team during dock inspection. Facility received satisfactory rating. Two minor housekeeping items noted — both addressed same day.',
      status: 'LIVE',
      locationId: locations[13].id,
      userId: users.guard13.id,
      createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Supervisor Security Check — West Islip',
      description: 'Conducted supervisor security check following vandalism incident. Walked entire dock perimeter with Guard Clark. Identified camera coverage gap at south dock section — noted for capital planning. Patrol log reviewed and initialed.',
      status: 'LIVE',
      locationId: locations[13].id,
      userId: users.supervisor2.id,
      createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      type: 'OTHER',
      title: 'Season Opening Preparation Review',
      description: 'Completed admin planning checklist for upcoming season opening at West Islip Marina. Items confirmed: slip assignments sent to all 40 holders, updated hours posted to Town website, lifesaving equipment inspected, staff certifications current. Opening day coordination meeting scheduled with supervisor team.',
      status: 'LIVE',
      locationId: locations[13].id,
      userId: users.admin2.id,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
  ]

  for (const entry of logEntries) {
    await prisma.log.create({
      data: entry,
    })
  }

  console.log(`✅ Created ${logEntries.length} log entries`)

  // Generate 300 additional historical log entries spread across past 4 weeks
  console.log('Creating 300 additional historical log entries...')

  const allGuards = [
    users.guard1, users.guard2, users.guard3, users.guard4, users.guard5,
    users.guard6, users.guard7, users.guard8, users.guard9, users.guard10,
    users.guard11, users.guard12, users.guard13, users.guard14,
  ]
  const allSupervisors = [users.supervisor1, users.supervisor2, users.supervisor3, users.supervisor4]
  const allAdmins = [users.admin1, users.admin2, users.admin3]

  const patrolTemplates = [
    { title: 'Routine Morning Patrol', description: 'Completed morning security patrol. All dock areas clear, gates secured, no unauthorized vessels or vehicles observed.' },
    { title: 'Afternoon Dock Walk', description: 'Conducted afternoon patrol of dock and parking areas. Vessel count matches slip registry. No incidents to report.' },
    { title: 'Evening Perimeter Check', description: 'Full perimeter sweep completed at end of shift. Fencing intact, all entry points locked. Dock lighting confirmed operational.' },
    { title: 'Night Security Rounds', description: 'Overnight patrol completed without incident. Dock quiet, vessels secure. Parking lot empty. Log updated.' },
    { title: 'Mid-Shift Dock Inspection', description: 'Mid-shift inspection of dock and waterfront. All slips occupied by registered vessels. No safety hazards noted.' },
    { title: 'Start-of-Shift Walkthrough', description: 'Beginning-of-shift facility walkthrough. Dock surface clear, safety equipment in place, no issues from overnight period.' },
    { title: 'Dock & Slip Area Patrol', description: 'Inspected all slip sections. Vessels properly secured. Dock boxes undisturbed. No unauthorized activity.' },
    { title: 'Parking Lot & Entrance Check', description: 'Checked parking lot, entrance gate, and access road. All vehicles with valid marina permits. No overnight vehicles without authorization.' },
    { title: 'Waterfront Security Patrol', description: 'Patrolled waterfront perimeter. Dock floating sections stable. No debris in water. Fire extinguisher stations checked — all present and charged.' },
    { title: 'Comprehensive Facility Patrol', description: 'Full facility patrol including dock, parking, utility areas, and restroom building. All areas satisfactory. No maintenance issues observed.' },
    { title: 'Supervisor Facility Inspection', description: 'Supervisor-conducted facility inspection. Reviewed guard logs, checked all safety equipment stations, spoke with on-duty staff. No deficiencies found.' },
    { title: 'Supervisor Rounds', description: 'Completed supervisor inspection rounds. Patrol logs initialed, equipment verified, guard coverage satisfactory. No issues escalated.' },
    { title: 'Admin Facility Walkthrough', description: 'Administrative facility walkthrough as part of monthly compliance review. All signage current, equipment serviceable, records in order.' },
    { title: 'Dock Access Control Check', description: 'Verified dock access gate logs and keycard records. All entries accounted for. No unrecognized access attempts. Gate mechanism functioning properly.' },
    { title: 'Quiet Night Patrol', description: 'Uneventful overnight patrol. All vessels secure, dock clear, perimeter intact. Weather calm. No calls or incidents during shift.' },
  ]

  const maintenanceTemplates = [
    { title: 'Weekly Safety Equipment Check', description: 'Weekly inspection of all safety equipment: life rings, throw bags, fire extinguishers, AED unit. All items present and serviceable. Documentation updated.' },
    { title: 'Trash & Recycling Collection', description: 'Emptied all dock and parking lot trash and recycling receptacles. Bins returned to stations. Dock area swept for loose debris.' },
    { title: 'Gate Lock Lubrication', description: 'Applied penetrating lubricant to all gate hinges and locking mechanisms as part of monthly preventive maintenance. All gates operating smoothly.' },
    { title: 'Dock Lighting Inspection', description: 'Tested all dock light fixtures. Two bulbs replaced. Timer settings verified for current sunset time. All fixtures now operational.' },
    { title: 'Dock Bumper Condition Check', description: 'Inspected dock bumpers and fender boards along all dock sections. Minor wear noted on section B bumpers — work order submitted for replacement.' },
    { title: 'Restroom & Facility Cleaning', description: 'Cleaned and sanitized dock restroom facilities. Restocked supplies. Reported dripping faucet to DPW maintenance line.' },
    { title: 'Life Ring Station Restock', description: 'Inspected and restocked all life ring stations. One throw bag rope was frayed — replaced from stock. All stations now at full complement.' },
    { title: 'First Aid Kit Restock', description: 'Restocked dock office first aid kit. Replenished gauze, bandages, antiseptic, and gloves. Verified AED pads within expiration date.' },
    { title: 'Dock Cleat Inspection', description: 'Checked dock cleat hardware throughout all sections. Found and tightened two loose cleats on Section D. No structural concerns.' },
    { title: 'Parking Lot Condition Review', description: 'Inspected parking lot surface, striping, and signage. Minor pothole noted near entrance — maintenance referral submitted. Signage legible and current.' },
    { title: 'Utility Pedestal Check', description: 'Checked all electric and water utility pedestals on dock. Three outlets showed minor corrosion — submitted electrical work order for service.' },
    { title: 'Fire Extinguisher Monthly Check', description: 'Completed monthly fire extinguisher pressure checks at all stations. All units show full charge. Tags current. One unit flagged for upcoming service date.' },
    { title: 'Security Camera Cleaning', description: 'Cleaned camera lenses and housing at all dock security cameras. Verified image quality on all feeds. No gaps in coverage noted.' },
    { title: 'Fuel Dock Safety Check', description: 'Monthly fuel dock safety inspection: spill kit verified, fuel nozzle condition acceptable, emergency shutoff tested functional, no leaks detected.' },
  ]

  const visitorTemplates = [
    { title: 'Transient Vessel Check-In', description: 'Transient boater checked in for day dockage. Registration and ID verified. Day fee collected. Vessel assigned to guest slip. Departure noted at end of shift.' },
    { title: 'Seasonal Slip Holder Arrival', description: 'Seasonal slip holder arrived to board their vessel for weekend use. Current permit and registration verified. Access tag issued. Logged per procedure.' },
    { title: 'Contractor Site Access', description: 'Contractor arrived for scheduled dock repair work. ID and company credentials verified. Work order reference confirmed. Contractor signed in and escorted to work area.' },
    { title: 'Boat Launch Guest Registration', description: 'Registered guest using public boat launch facility. Trailer number logged, launch fee collected, waiver signed. Estimated return time recorded.' },
    { title: 'Marina Guest — Overnight Stay', description: 'Vessel owner and crew checked in for overnight stay at guest dock. Documentation verified. Marina rules sheet provided. Emergency contact collected.' },
    { title: 'Charter Boat Return Log', description: 'Charter fishing vessel returned from day trip with passengers. Passenger count verified against departure log. No injuries or incidents reported by captain.' },
    { title: 'Youth Group Launch', description: 'Supervised youth kayak group used boat launch. Adult leader permit verified. All youth in properly fitted PFDs. Group waiver on file.' },
    { title: 'Vendor Delivery Access', description: 'Marine supply vendor made scheduled delivery. Delivery personnel ID verified. Vehicle access logged. Delivery completed without incident.' },
    { title: 'Town Official Site Visit', description: 'Town of Islip official conducted informal facility tour. Guard accompanied during dock walk. No concerns raised. Visit logged per protocol.' },
    { title: 'Harbormaster Check-In', description: 'Town Harbormaster visited for monthly coordination meeting. Reviewed recent incidents, upcoming events, and staff scheduling. Meeting notes filed.' },
    { title: 'Insurance Inspector Visit', description: 'Marina liability insurance inspector conducted annual policy review visit. Facility walk completed. Inspector noted improvements in safety coverage.' },
    { title: 'DEC Officer Routine Inspection', description: 'NYS DEC Officer conducted routine vessel registration and safety compliance check. Guard accompanied during dock walk. No violations noted.' },
    { title: 'Filming Permit Crew', description: 'Documentary film crew with valid Town filming permit arrived. Permit verified, restrictions reviewed. Crew departed after scheduled session.' },
    { title: 'USCG Auxiliary Facility Check', description: 'US Coast Guard Auxiliary conducted routine facility safety check. Guard escorted team. Facility received satisfactory rating.' },
  ]

  const weatherTemplates = [
    { title: 'Small Craft Advisory Posted', description: 'NWS issued small craft advisory for Great South Bay. Advisory signs posted at dock entrance. Advised departing boaters of conditions. Checked all vessel lines.' },
    { title: 'High Winds — Vessel Check', description: 'Sustained winds 20-28 mph with gusts to 38 mph. Conducted emergency inspection of all slip tie-downs. Added spring lines to 4 vessels with inadequate securing.' },
    { title: 'Heavy Rain — Drainage Check', description: 'Significant rainfall over 3 hours. Inspected all storm drains — no blockages. Minor surface pooling near boat ramp cleared. No flooding damage.' },
    { title: 'Morning Fog Advisory', description: 'Dense fog advisory in effect early morning. Posted advisory at dock entrance. Two vessels with early departures advised to delay until visibility improved.' },
    { title: 'Thunderstorm Protocol Activated', description: 'Thunderstorm activity within 5 miles — dock closed to water activity per safety protocol. All persons cleared from waterfront. Reopened following all-clear.' },
    { title: 'Post-Storm Inspection', description: 'Post-storm facility inspection following overnight weather. All vessels secure. Minor debris cleared from dock surface. No structural damage observed.' },
    { title: 'Tidal Surge Advisory', description: 'NOAA tidal surge advisory issued for Great South Bay. Monitored dock float heights. All connections holding. No flooding of dock walkway.' },
    { title: 'Heat Advisory — Visitor Safety', description: 'NWS heat advisory in effect. Additional water stocked at guard station. Dock visitors reminded to stay hydrated. Extra wellness checks on working staff.' },
    { title: 'Winter Storm Watch', description: 'Winter storm watch issued. Dock walkways pre-treated with ice melt. Snow removal equipment staged at facility entrance. Slip holders notified of conditions.' },
    { title: 'Low Tide Ramp Access Advisory', description: 'Extreme low tide rendered lower ramp section inaccessible for deep-draft vessels. Posted temporary advisory. Advised boaters to return at high tide.' },
  ]

  const incidentTemplates2 = [
    { title: 'Unauthorized Vessel in Restricted Area', description: 'Vessel observed operating in posted no-wake/restricted area without proper authorization.', severity: 'LOW' as const, actionsTaken: 'Vessel flagged down and operator informed of restricted area. Verbal warning issued. Vessel operator complied and departed area. Incident logged.', followUpRequired: false },
    { title: 'Slip Holder Noise Complaint', description: 'Adjacent slip holders involved in noise dispute regarding late-night music from a vessel.', severity: 'LOW' as const, actionsTaken: 'Both parties separated and spoken to individually. Music stopped. Both given marina quiet-hours policy reminder. Situation resolved without further escalation.', followUpRequired: false },
    { title: 'Dock Cleat Failure', description: 'Dock cleat failed due to corroded mounting hardware, causing moored vessel to drift partially out of slip. No collision occurred; vessel recovered.', severity: 'MEDIUM' as const, actionsTaken: 'Vessel re-secured using adjacent cleat. Failed cleat cordoned off. Temporary tie-off rigged. Emergency maintenance work order submitted. Slip holder notified.', followUpRequired: true },
    { title: 'Minor Dock Slip and Fall', description: 'Visitor slipped on wet dock surface near the fuel dock approach and sustained a minor scrape on the hand.', severity: 'LOW' as const, actionsTaken: 'First aid administered on scene. Incident form completed. Area marked with wet floor caution sign. Non-skid tape applied to affected section.', followUpRequired: false },
    { title: 'Lost Child at Marina', description: 'Child approximately 7 years old found unaccompanied near dock entrance and unable to locate parents.', severity: 'MEDIUM' as const, actionsTaken: 'Child brought to guard station. PA announcement made. Parents located within 8 minutes. Parents reminded of marina supervision requirements for minors.', followUpRequired: false },
    { title: 'Vessel Engine Compartment Fire', description: 'Minor engine compartment fire on slip holder vessel. Owner used onboard extinguisher; fire contained before guard arrived on scene.', severity: 'HIGH' as const, actionsTaken: 'Suffolk County FD notified and responded. Fire confirmed extinguished on arrival. Vessel tagged not operational until inspected by marine mechanic. Owner notified.', followUpRequired: true },
    { title: 'Propane Leak Reported', description: 'Slip holder reported smell of propane near their vessel. Guard confirmed odor on approach to slip area.', severity: 'HIGH' as const, actionsTaken: 'Area evacuated within 50-foot radius. SCFD notified and responded. Source identified as loose tank connection on vessel. Owner addressed leak; cleared by FD before re-boarding.', followUpRequired: false },
    { title: 'Parking Lot Vehicle Dispute', description: 'Two marina patrons involved in verbal altercation over parking space in main lot.', severity: 'LOW' as const, actionsTaken: 'Guard intervened and separated parties. Situation de-escalated. Both parties reminded of marina rules. No physical contact occurred. Vehicles relocated to resolve dispute.', followUpRequired: false },
    { title: 'Swimmer in Restricted Area', description: 'Individual observed swimming in restricted marina boat channel where active vessel traffic operates.', severity: 'MEDIUM' as const, actionsTaken: 'Individual directed to exit water immediately; complied. Escorted to shore. Reminded that swimming in boat channel is prohibited. Verbal warning issued and logged.', followUpRequired: false },
    { title: 'Vandalism to Marina Signage', description: 'Discovered that two marina regulatory signs were spray-painted with graffiti overnight.', severity: 'MEDIUM' as const, actionsTaken: 'Photographed damage. Signs temporarily covered. Graffiti removal reported to DPW. SCPD non-emergency report filed. Camera footage reviewed for suspect identification.', followUpRequired: true },
  ]

  const otherTemplates = [
    { title: 'Lost and Found — Personal Item', description: 'Personal item found on dock or in parking area. Item secured in office lost and found log. Owner contact attempted via marina registry where applicable.' },
    { title: 'Wildlife Sighting — Log Entry', description: 'Notable wildlife observed during patrol. Photographed and logged per environmental observation protocol. No operational impact.' },
    { title: 'Slip Renewal Inquiry Handled', description: 'Slip holders inquired about upcoming season renewal process at guard station. Marina office contact information and online renewal portal information provided.' },
    { title: 'Community Event Coordination Note', description: 'Logged coordination activity for upcoming community event at marina. Parking plan, dock access requirements, and security arrangements reviewed with event organizer.' },
    { title: 'Staff Briefing — Policy Update', description: 'On-duty staff received briefing on updated marina access policy from supervisor. Changes acknowledged in shift log. Updated procedure sheet posted at guard station.' },
    { title: 'Emergency Contact List Review', description: 'Reviewed and updated emergency contact information for active slip holders. Majority of contacts confirmed current. Follow-up notices sent for outstanding updates.' },
    { title: 'End-of-Season Equipment Check', description: 'Assisted with seasonal safety equipment inventory. Items cataloged and stored in dock shed. List submitted to supervisor for readiness review.' },
    { title: 'Neighboring Property Liaison Note', description: 'Matter regarding shared boundary addressed with adjacent property representative. Referred to admin for formal follow-up. No immediate operational impact.' },
  ]

  let additionalCount = 0

  for (let i = 0; i < 300; i++) {
    const locIdx = i % locations.length
    const loc = locations[locIdx]

    // Cycle: 3 guard entries, 1 supervisor, 1 admin per 5-entry group
    const cyclePos = Math.floor(i / locations.length) % 5
    let userId: string
    if (cyclePos <= 2) {
      userId = allGuards[(locIdx * 3 + cyclePos) % allGuards.length].id
    } else if (cyclePos === 3) {
      userId = allSupervisors[locIdx % allSupervisors.length].id
    } else {
      userId = allAdmins[locIdx % allAdmins.length].id
    }

    // Spread timestamps from 4 days ago to 30 days ago (96h–720h)
    const hoursAgo = 96 + Math.floor((i / 300) * 624) + (locIdx * 2)
    const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)

    // Assign log type: 40% PATROL, 15% MAINTENANCE, 20% VISITOR_CHECKIN, 10% WEATHER, 10% INCIDENT, 5% OTHER
    const typeSlot = Math.floor(i / locations.length) % 10
    let logType: string
    let title: string
    let description: string
    let extra: Partial<Prisma.LogUncheckedCreateInput> = {}

    if (typeSlot <= 3) {
      logType = 'PATROL'
      const t = patrolTemplates[i % patrolTemplates.length]
      title = t.title; description = t.description
    } else if (typeSlot === 4) {
      logType = 'MAINTENANCE'
      const t = maintenanceTemplates[i % maintenanceTemplates.length]
      title = t.title; description = t.description
    } else if (typeSlot <= 6) {
      logType = 'VISITOR_CHECKIN'
      const t = visitorTemplates[i % visitorTemplates.length]
      title = t.title; description = t.description
    } else if (typeSlot === 7) {
      logType = 'WEATHER'
      const t = weatherTemplates[i % weatherTemplates.length]
      title = t.title; description = t.description
    } else if (typeSlot === 8) {
      logType = 'INCIDENT'
      const t = incidentTemplates2[i % incidentTemplates2.length]
      title = t.title; description = t.description
      extra = {
        severity: t.severity,
        incidentTime: createdAt,
        actionsTaken: t.actionsTaken,
        followUpRequired: t.followUpRequired,
      }
      if (i % 2 === 0) {
        extra.reviewedBy = allSupervisors[locIdx % allSupervisors.length].id
        extra.reviewedAt = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000)
        extra.reviewNotes = 'Reviewed and acknowledged. Appropriate action taken by guard on duty.'
        extra.status = 'UPDATED'
      }
    } else {
      logType = 'OTHER'
      const t = otherTemplates[i % otherTemplates.length]
      title = t.title; description = t.description
    }

    await prisma.log.create({
      data: {
        type: logType as 'PATROL' | 'MAINTENANCE' | 'VISITOR_CHECKIN' | 'WEATHER' | 'INCIDENT' | 'OTHER',
        title,
        description,
        status: (extra.status ?? 'LIVE') as 'LIVE' | 'UPDATED' | 'ARCHIVED' | 'DRAFT',
        locationId: loc.id,
        userId,
        createdAt,
        ...extra,
      } as Prisma.LogUncheckedCreateInput,
    })
    additionalCount++
  }

  console.log(`✅ Created ${additionalCount} additional log entries (total: ${logEntries.length + additionalCount})`)

  // Create Timesheets with Entries
  console.log('Creating timesheets...')

  // Helper to get week boundaries (Sunday 00:00 to Saturday 23:59)
  const getWeekBoundaries = (daysOffset: number) => {
    const date = new Date(now)
    date.setDate(date.getDate() + daysOffset)
    const day = date.getDay() // 0 = Sunday, 6 = Saturday

    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - day) // Go back to Sunday
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // Saturday
    weekEnd.setHours(23, 59, 59, 999)

    return { weekStart, weekEnd }
  }

  // Helper to calculate hours between two dates
  const calculateHours = (start: Date, end: Date) => {
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  }

  // Create past week timesheets (last week - already submitted/approved)
  const lastWeek = getWeekBoundaries(-7)

  // Guard 1 - Last week - APPROVED
  const timesheet1 = await prisma.timesheet.create({
    data: {
      userId: users.guard1.id,
      createdBy: users.supervisor1.id,
      weekStartDate: lastWeek.weekStart,
      weekEndDate: lastWeek.weekEnd,
      totalHours: 40,
      totalEntries: 5,
      status: 'APPROVED',
      submittedAt: new Date(lastWeek.weekEnd.getTime() + 2 * 60 * 60 * 1000), // 2 hours after week end
      approvedBy: users.supervisor1.id,
      approvedAt: new Date(lastWeek.weekEnd.getTime() + 24 * 60 * 60 * 1000), // 1 day after week end
    }
  })

  // Add entries for timesheet1 (5 days, 8 hours each)
  for (let i = 0; i < 5; i++) {
    const entryDate = new Date(lastWeek.weekStart)
    entryDate.setDate(lastWeek.weekStart.getDate() + i)
    entryDate.setHours(7, 0, 0, 0)

    const clockIn = new Date(entryDate)
    const clockOut = new Date(entryDate)
    clockOut.setHours(15, 0, 0, 0)

    await prisma.timesheetEntry.create({
      data: {
        timesheetId: timesheet1.id,
        date: entryDate,
        clockInTime: clockIn,
        clockOutTime: clockOut,
        hoursWorked: 8,
        locationId: locations[0].id, // Atlantique Marina
        wasAdjusted: false,
        wasManuallyAdded: false,
      }
    })
  }

  // Guard 2 - Last week - APPROVED
  const timesheet2 = await prisma.timesheet.create({
    data: {
      userId: users.guard2.id,
      createdBy: users.supervisor1.id,
      weekStartDate: lastWeek.weekStart,
      weekEndDate: lastWeek.weekEnd,
      totalHours: 32,
      totalEntries: 4,
      status: 'APPROVED',
      submittedAt: new Date(lastWeek.weekEnd.getTime() + 3 * 60 * 60 * 1000),
      approvedBy: users.supervisor1.id,
      approvedAt: new Date(lastWeek.weekEnd.getTime() + 25 * 60 * 60 * 1000),
    }
  })

  // Add entries for timesheet2 (4 days, 8 hours each)
  for (let i = 0; i < 4; i++) {
    const entryDate = new Date(lastWeek.weekStart)
    entryDate.setDate(lastWeek.weekStart.getDate() + i)
    entryDate.setHours(15, 0, 0, 0)

    const clockIn = new Date(entryDate)
    const clockOut = new Date(entryDate)
    clockOut.setHours(23, 0, 0, 0)

    await prisma.timesheetEntry.create({
      data: {
        timesheetId: timesheet2.id,
        date: entryDate,
        clockInTime: clockIn,
        clockOutTime: clockOut,
        hoursWorked: 8,
        locationId: locations[1].id, // Bay Shore Marina
        wasAdjusted: false,
        wasManuallyAdded: false,
      }
    })
  }

  // Current week timesheets (various statuses)
  const currentWeek = getWeekBoundaries(0)

  // Guard 3 - Current week - DRAFT (can be edited)
  const timesheet3 = await prisma.timesheet.create({
    data: {
      userId: users.guard3.id,
      createdBy: users.supervisor1.id,
      weekStartDate: currentWeek.weekStart,
      weekEndDate: currentWeek.weekEnd,
      totalHours: 24,
      totalEntries: 3,
      status: 'DRAFT',
    }
  })

  // Add entries for timesheet3 (3 days so far)
  for (let i = 0; i < 3; i++) {
    const entryDate = new Date(currentWeek.weekStart)
    entryDate.setDate(currentWeek.weekStart.getDate() + i)
    entryDate.setHours(7, 0, 0, 0)

    const clockIn = new Date(entryDate)
    const clockOut = new Date(entryDate)
    clockOut.setHours(15, 0, 0, 0)

    await prisma.timesheetEntry.create({
      data: {
        timesheetId: timesheet3.id,
        date: entryDate,
        clockInTime: clockIn,
        clockOutTime: clockOut,
        hoursWorked: 8,
        locationId: locations[1].id, // Bay Shore Marina
        wasAdjusted: false,
        wasManuallyAdded: false,
      }
    })
  }

  // Guard 4 - Current week - PENDING (submitted, awaiting approval)
  const timesheet4 = await prisma.timesheet.create({
    data: {
      userId: users.guard4.id,
      createdBy: users.supervisor1.id,
      weekStartDate: currentWeek.weekStart,
      weekEndDate: currentWeek.weekEnd,
      totalHours: 32,
      totalEntries: 4,
      status: 'PENDING',
      submittedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    }
  })

  // Add entries for timesheet4 with one adjustment
  for (let i = 0; i < 4; i++) {
    const entryDate = new Date(currentWeek.weekStart)
    entryDate.setDate(currentWeek.weekStart.getDate() + i)
    entryDate.setHours(15, 0, 0, 0)

    const clockIn = new Date(entryDate)
    const clockOut = new Date(entryDate)
    clockOut.setHours(23, 0, 0, 0)

    const entry = await prisma.timesheetEntry.create({
      data: {
        timesheetId: timesheet4.id,
        date: entryDate,
        clockInTime: clockIn,
        clockOutTime: clockOut,
        hoursWorked: 8,
        locationId: locations[9].id, // Ocean Avenue Marina
        wasAdjusted: i === 1, // Second entry was adjusted
        wasManuallyAdded: false,
        originalHours: i === 1 ? 7.5 : undefined,
      }
    })

    // Add adjustment record for second entry
    if (i === 1) {
      await prisma.timesheetAdjustment.create({
        data: {
          entryId: entry.id,
          timesheetId: timesheet4.id,
          type: 'TIME_EDITED',
          fieldChanged: 'clockInTime',
          oldValue: JSON.stringify({ clockInTime: new Date(clockIn.getTime() + 30 * 60 * 1000), hours: 7.5 }),
          newValue: JSON.stringify({ clockInTime: clockIn, hours: 8 }),
          reason: 'Clock-in time corrected - guard forgot to clock in on time, actually started at 2:30pm',
          adjustedBy: users.supervisor1.id,
        }
      })
    }
  }

  // Guard 5 - Current week - PENDING (ready for bulk approval)
  const timesheet5 = await prisma.timesheet.create({
    data: {
      userId: users.guard5.id,
      createdBy: users.supervisor2.id,
      weekStartDate: currentWeek.weekStart,
      weekEndDate: currentWeek.weekEnd,
      totalHours: 40,
      totalEntries: 5,
      status: 'PENDING',
      submittedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
    }
  })

  // Add entries for timesheet5
  for (let i = 0; i < 5; i++) {
    const entryDate = new Date(currentWeek.weekStart)
    entryDate.setDate(currentWeek.weekStart.getDate() + i)
    entryDate.setHours(7, 0, 0, 0)

    const clockIn = new Date(entryDate)
    const clockOut = new Date(entryDate)
    clockOut.setHours(15, 0, 0, 0)

    await prisma.timesheetEntry.create({
      data: {
        timesheetId: timesheet5.id,
        date: entryDate,
        clockInTime: clockIn,
        clockOutTime: clockOut,
        hoursWorked: 8,
        locationId: locations[4].id, // East Islip Marina
        wasAdjusted: false,
        wasManuallyAdded: false,
      }
    })
  }

  // Guard 6 - Current week - REJECTED (needs correction)
  const timesheet6 = await prisma.timesheet.create({
    data: {
      userId: users.guard6.id,
      createdBy: users.supervisor2.id,
      weekStartDate: currentWeek.weekStart,
      weekEndDate: currentWeek.weekEnd,
      totalHours: 35,
      totalEntries: 5,
      status: 'REJECTED',
      submittedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
      rejectedBy: users.supervisor2.id,
      rejectedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      rejectionReason: 'Time entries for Wednesday appear incorrect. Clock-out time shows 11pm but shift ended at 3pm. Please verify and resubmit.',
    }
  })

  // Add entries for timesheet6
  for (let i = 0; i < 5; i++) {
    const entryDate = new Date(currentWeek.weekStart)
    entryDate.setDate(currentWeek.weekStart.getDate() + i)
    entryDate.setHours(7, 0, 0, 0)

    const clockIn = new Date(entryDate)
    const clockOut = new Date(entryDate)
    // Incorrect time on day 3
    clockOut.setHours(i === 2 ? 23 : 14, 0, 0, 0)

    await prisma.timesheetEntry.create({
      data: {
        timesheetId: timesheet6.id,
        date: entryDate,
        clockInTime: clockIn,
        clockOutTime: clockOut,
        hoursWorked: i === 2 ? 16 : 7,
        locationId: locations[10].id, // Port O'Call Marina
        wasAdjusted: false,
        wasManuallyAdded: false,
      }
    })
  }

  // Guard 7 - Current week - PENDING (another for bulk approval)
  const timesheet7 = await prisma.timesheet.create({
    data: {
      userId: users.guard7.id,
      createdBy: users.supervisor1.id,
      weekStartDate: currentWeek.weekStart,
      weekEndDate: currentWeek.weekEnd,
      totalHours: 36,
      totalEntries: 5,
      status: 'PENDING',
      submittedAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
    }
  })

  // Add entries for timesheet7 (varied hours)
  const hours7 = [8, 7.5, 8, 6.5, 6]
  for (let i = 0; i < 5; i++) {
    const entryDate = new Date(currentWeek.weekStart)
    entryDate.setDate(currentWeek.weekStart.getDate() + i)
    entryDate.setHours(15, 0, 0, 0)

    const clockIn = new Date(entryDate)
    const clockOut = new Date(entryDate)
    clockOut.setHours(15 + Math.floor(hours7[i]), (hours7[i] % 1) * 60, 0, 0)

    await prisma.timesheetEntry.create({
      data: {
        timesheetId: timesheet7.id,
        date: entryDate,
        clockInTime: clockIn,
        clockOutTime: clockOut,
        hoursWorked: hours7[i],
        locationId: locations[13].id, // West Islip Marina
        wasAdjusted: false,
        wasManuallyAdded: i === 4, // Last entry was manually added
      }
    })
  }

  // Guard 8 - Current week - DRAFT with manual entry
  const timesheet8 = await prisma.timesheet.create({
    data: {
      userId: users.guard8.id,
      createdBy: users.supervisor2.id,
      weekStartDate: currentWeek.weekStart,
      weekEndDate: currentWeek.weekEnd,
      totalHours: 16.5,
      totalEntries: 2,
      status: 'DRAFT',
    }
  })

  // Add entries for timesheet8 (one regular, one manual)
  const entries8 = [
    { hours: 8, manual: false },
    { hours: 8.5, manual: true },
  ]

  for (let i = 0; i < entries8.length; i++) {
    const entryDate = new Date(currentWeek.weekStart)
    entryDate.setDate(currentWeek.weekStart.getDate() + i)
    entryDate.setHours(7, 0, 0, 0)

    const clockIn = new Date(entryDate)
    const clockOut = new Date(entryDate)
    clockOut.setHours(7 + Math.floor(entries8[i].hours), (entries8[i].hours % 1) * 60, 0, 0)

    await prisma.timesheetEntry.create({
      data: {
        timesheetId: timesheet8.id,
        date: entryDate,
        clockInTime: clockIn,
        clockOutTime: clockOut,
        hoursWorked: entries8[i].hours,
        locationId: locations[6].id, // Homan Creek Dock
        wasAdjusted: false,
        wasManuallyAdded: entries8[i].manual,
      }
    })
  }

  console.log('✅ Created 8 timesheets with entries')
  console.log('   - 2 APPROVED (last week)')
  console.log('   - 2 DRAFT (current week, can be edited)')
  console.log('   - 3 PENDING (current week, ready for approval)')
  console.log('   - 1 REJECTED (current week, needs correction)')

  console.log('\n🎉 Seed completed successfully!')
  console.log('Summary: 22 users, 14 locations, 15 shifts, 18 shift assignments, 5 duty sessions, 2 check-ins, ' + logEntries.length + ' logs, 8 timesheets')
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
