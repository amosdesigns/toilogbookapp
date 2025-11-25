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
    // PATROL logs from various guards at different locations
    {
      type: 'PATROL',
      title: 'Morning Security Rounds',
      description: 'Completed morning patrol of Atlantique Marina. All gates secured, no unauthorized vessels.',
      status: 'LIVE',
      locationId: locations[0].id, // Atlantique Marina
      userId: users.guard1.id,
      createdAt: new Date(now.getTime() - 11 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Perimeter Check',
      description: 'Conducted full perimeter walk. Noticed loose gate hinge at north entrance, maintenance notified.',
      status: 'LIVE',
      locationId: locations[1].id, // Bay Shore Marina
      userId: users.guard3.id,
      createdAt: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Evening Security Sweep',
      description: 'Evening patrol completed. Parking lot clear, all dock lights operational.',
      status: 'LIVE',
      locationId: locations[4].id, // East Islip Marina
      userId: users.guard5.id,
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Dock Inspection',
      description: 'Inspected all dock sections. Found debris near slip 12, cleared immediately.',
      status: 'LIVE',
      locationId: locations[13].id, // West Islip Marina
      userId: users.guard7.id,
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },

    // INCIDENT logs with varying severities
    {
      type: 'INCIDENT',
      title: 'Unauthorized Access Attempt',
      description: 'Individual attempted to enter locked gate area at approximately 02:15. Subject left when approached.',
      status: 'LIVE',
      severity: 'MEDIUM',
      locationId: locations[2].id, // Brown's River East Side
      userId: users.guard2.id,
      incidentTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
      actionsTaken: 'Subject was approached and informed area was closed. Left without incident. Incident logged.',
      followUpRequired: false,
      createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      type: 'INCIDENT',
      title: 'Minor Boat Collision',
      description: 'Two recreational boats made contact while docking. Minor hull scratches, no injuries.',
      status: 'UPDATED',
      severity: 'LOW',
      locationId: locations[5].id, // Great River Ramp
      userId: users.guard4.id,
      incidentTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      peopleInvolved: 'John Smith (Slip 45), Mary Johnson (Slip 47)',
      witnesses: 'Guard on duty, dock attendant',
      actionsTaken: 'Parties exchanged insurance information. Photos taken of damage. Report filed.',
      followUpRequired: true,
      reviewedBy: users.supervisor1.id,
      reviewedAt: new Date(now.getTime() - 7 * 60 * 60 * 1000),
      reviewNotes: 'Insurance companies contacted. Follow up scheduled for tomorrow.',
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      type: 'INCIDENT',
      title: 'Medical Emergency',
      description: 'Elderly visitor experienced chest pains near dock entrance. EMS called immediately.',
      status: 'UPDATED',
      severity: 'CRITICAL',
      locationId: locations[9].id, // Ocean Avenue Marina
      userId: users.guard6.id,
      incidentTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      peopleInvolved: 'Robert Martinez (Visitor, Age 72)',
      actionsTaken: 'Called 911 at 08:45. First aid administered until EMS arrival at 08:52. Patient transported to hospital.',
      followUpRequired: true,
      reviewedBy: users.supervisor2.id,
      reviewedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      reviewNotes: 'EMS Report #2024-1156. Family contacted. Incident report filed with town office.',
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },

    // VISITOR_CHECKIN logs
    {
      type: 'VISITOR_CHECKIN',
      title: 'Contractor Check-in',
      description: 'Marine Electric contractor arrived for scheduled dock light repairs.',
      status: 'LIVE',
      locationId: locations[8].id, // Maple Street Dock
      userId: users.guard8.id,
      createdAt: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'Boat Owner Check-in',
      description: 'Seasonal slip holder (Slip 23) checked in for weekend stay.',
      status: 'LIVE',
      locationId: locations[10].id, // Port O'Call Marina
      userId: users.guard9.id,
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      type: 'VISITOR_CHECKIN',
      title: 'Inspector Visit',
      description: 'NYS Parks Inspector conducted routine facility inspection. All items passed.',
      status: 'LIVE',
      locationId: locations[0].id, // Atlantique Marina
      userId: users.superAdmin.id,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },

    // MAINTENANCE logs
    {
      type: 'MAINTENANCE',
      title: 'Gate Lock Lubrication',
      description: 'Applied lubricant to main gate locks as part of weekly maintenance.',
      status: 'LIVE',
      locationId: locations[6].id, // Homan Creek Dock
      userId: users.guard10.id,
      createdAt: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    },
    {
      type: 'MAINTENANCE',
      title: 'Dock Light Replacement',
      description: 'Replaced burned out bulbs in dock lights #12 and #15.',
      status: 'LIVE',
      locationId: locations[7].id, // Maple Avenue Dock
      userId: users.guard11.id,
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      type: 'MAINTENANCE',
      title: 'Trash Collection',
      description: 'Emptied all trash receptacles. Noted recycling bin near capacity.',
      status: 'LIVE',
      locationId: locations[11].id, // Raymond Street Dock
      userId: users.guard12.id,
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },

    // WEATHER logs
    {
      type: 'WEATHER',
      title: 'High Wind Advisory',
      description: 'Strong winds 25-30 mph from NE. All small craft warnings posted. Checked all vessel tie-downs.',
      status: 'LIVE',
      locationId: locations[3].id, // Brown's River West Side
      userId: users.guard13.id,
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      type: 'WEATHER',
      title: 'Heavy Rain Event',
      description: 'Significant rainfall overnight. Checked all drain systems, no flooding observed.',
      status: 'LIVE',
      locationId: locations[12].id, // West Avenue Dock
      userId: users.guard14.id,
      createdAt: new Date(now.getTime() - 11 * 60 * 60 * 1000),
    },

    // OTHER logs
    {
      type: 'OTHER',
      title: 'Lost and Found',
      description: 'Found wallet on dock bench. Secured in office safe, owner contacted.',
      status: 'LIVE',
      locationId: locations[1].id, // Bay Shore Marina
      userId: users.guard1.id,
      createdAt: new Date(now.getTime() - 4.5 * 60 * 60 * 1000),
    },
    {
      type: 'OTHER',
      title: 'Wildlife Observation',
      description: 'Observed osprey nest on channel marker #7. Photos taken for wildlife log.',
      status: 'LIVE',
      locationId: locations[4].id, // East Islip Marina
      userId: users.guard3.id,
      createdAt: new Date(now.getTime() - 3.5 * 60 * 60 * 1000),
    },

    // Supervisor logs
    {
      type: 'PATROL',
      title: 'Multi-Location Inspection',
      description: 'Conducted rounds at Atlantique, Bay Shore, and East Islip. All guards on duty, no issues noted.',
      status: 'LIVE',
      locationId: locations[0].id, // Atlantique Marina
      userId: users.supervisor1.id,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      type: 'INCIDENT',
      title: 'Equipment Malfunction',
      description: 'Security camera #3 offline. IT support notified, temporary coverage arranged.',
      status: 'LIVE',
      severity: 'MEDIUM',
      locationId: locations[13].id, // West Islip Marina
      userId: users.supervisor2.id,
      incidentTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      actionsTaken: 'Submitted work order #2024-567. Increased patrol frequency in affected area.',
      followUpRequired: true,
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },

    // Admin logs
    {
      type: 'OTHER',
      title: 'Staff Training Session',
      description: 'Conducted quarterly safety training for all guards. 18 staff members attended.',
      status: 'LIVE',
      locationId: locations[0].id, // Atlantique Marina
      userId: users.admin1.id,
      createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
    },
    {
      type: 'PATROL',
      title: 'Facility Assessment',
      description: 'Annual security assessment of all dock facilities. Recommendations to be submitted next week.',
      status: 'LIVE',
      locationId: locations[5].id, // Great River Ramp
      userId: users.admin2.id,
      createdAt: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
  ]

  for (const entry of logEntries) {
    await prisma.log.create({
      data: entry,
    })
  }

  console.log(`✅ Created ${logEntries.length} log entries`)
  console.log('\n🎉 Seed completed successfully!')
  console.log('Summary: 22 users, 14 locations, 15 shifts, 18 shift assignments, 5 duty sessions, 2 check-ins, ' + logEntries.length + ' logs')
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
