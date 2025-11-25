require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function runMigrations() {
  const client = await pool.connect()

  try {
    console.log('🔄 Running database migrations...')

    // Get all migration directories in order
    const migrationsDir = path.join(__dirname, 'prisma', 'migrations')
    const migrations = fs.readdirSync(migrationsDir)
      .filter(dir => dir.match(/^\d+_/))
      .sort()

    console.log(`Found ${migrations.length} migrations`)

    for (const migration of migrations) {
      const migrationPath = path.join(migrationsDir, migration, 'migration.sql')

      if (fs.existsSync(migrationPath)) {
        console.log(`  Running: ${migration}`)
        const sql = fs.readFileSync(migrationPath, 'utf-8')
        try {
          await client.query(sql)
          console.log(`  ✅ Completed: ${migration}`)
        } catch (error) {
          // Continue if already exists errors
          // 42P07: relation already exists, 42710: type already exists
          // 42P06: duplicate schema, 42701: column already exists
          if (error.code === '42P07' || error.code === '42710' || error.code === '42P06' || error.code === '42701') {
            console.log(`  ⚠️  Skipped (already exists): ${migration} - ${error.message}`)
          } else {
            throw error
          }
        }
      }
    }

    console.log('✅ All migrations completed successfully!')
  } catch (error) {
    console.error('❌ Migration error:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runMigrations()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
