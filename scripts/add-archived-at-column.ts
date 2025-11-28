import { prisma } from '../lib/prisma'

async function addArchivedAtColumn() {
  try {
    // Check if column exists
    const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'User'
      AND column_name = 'archivedAt'
    `

    if (result.length > 0) {
      console.log('✓ archivedAt column already exists')
      return
    }

    // Add the column
    await prisma.$executeRaw`
      ALTER TABLE "User"
      ADD COLUMN "archivedAt" TIMESTAMP(3)
    `

    console.log('✓ Successfully added archivedAt column to User table')
  } catch (error) {
    console.error('Error adding archivedAt column:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addArchivedAtColumn()
