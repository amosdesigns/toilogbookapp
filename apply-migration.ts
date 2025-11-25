import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { readFileSync } from 'fs'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function applyMigration() {
  try {
    console.log('Reading migration file...')
    const migrationSQL = readFileSync(
      'prisma/migrations/20251125_add_all_missing_tables/migration.sql',
      'utf-8'
    )

    console.log('Applying migration to database...')
    await prisma.$executeRawUnsafe(migrationSQL)

    console.log('✅ Migration applied successfully!')
    await prisma.$disconnect()
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error applying migration:', error)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  }
}

applyMigration()
