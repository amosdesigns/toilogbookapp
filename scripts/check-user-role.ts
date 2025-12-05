/**
 * Debug script to check current user's role
 */

import 'dotenv/config'
import '../prisma.config'
import { prisma } from '../lib/prisma'

async function main() {
  console.log('🔍 Checking users and their roles...\n')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      clerkId: true,
    },
    orderBy: {
      email: 'asc'
    }
  })

  console.log(`Found ${users.length} users:\n`)

  users.forEach(user => {
    console.log(`📧 ${user.email}`)
    console.log(`   Name: ${user.firstName} ${user.lastName}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Clerk ID: ${user.clerkId || '(not set)'}`)
    console.log()
  })

  // Count by role
  const roleCounts = await prisma.user.groupBy({
    by: ['role'],
    _count: true
  })

  console.log('📊 Role Distribution:')
  roleCounts.forEach(group => {
    console.log(`   ${group.role}: ${group._count}`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
