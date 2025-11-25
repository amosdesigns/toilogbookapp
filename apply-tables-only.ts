import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function applyTables() {
  try {
    console.log('Creating missing tables...')
    
    // Only create the tables that don't exist (skip enums)
    const sql = `
-- CreateTable: SafetyChecklistItem
CREATE TABLE IF NOT EXISTS "SafetyChecklistItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SafetyChecklistResponse
CREATE TABLE IF NOT EXISTS "SafetyChecklistResponse" (
    "id" TEXT NOT NULL,
    "dutySessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "logId" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyChecklistResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SafetyChecklistItemCheck
CREATE TABLE IF NOT EXISTS "SafetyChecklistItemCheck" (
    "id" TEXT NOT NULL,
    "safetyChecklistResponseId" TEXT NOT NULL,
    "safetyChecklistItemId" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyChecklistItemCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX IF NOT EXISTS "SafetyChecklistItem_name_key" ON "SafetyChecklistItem"("name");
CREATE INDEX IF NOT EXISTS "SafetyChecklistItem_isActive_idx" ON "SafetyChecklistItem"("isActive");
CREATE INDEX IF NOT EXISTS "SafetyChecklistItem_order_idx" ON "SafetyChecklistItem"("order");

CREATE UNIQUE INDEX IF NOT EXISTS "SafetyChecklistResponse_logId_key" ON "SafetyChecklistResponse"("logId");
CREATE INDEX IF NOT EXISTS "SafetyChecklistResponse_dutySessionId_idx" ON "SafetyChecklistResponse"("dutySessionId");
CREATE INDEX IF NOT EXISTS "SafetyChecklistResponse_userId_idx" ON "SafetyChecklistResponse"("userId");
CREATE INDEX IF NOT EXISTS "SafetyChecklistResponse_locationId_idx" ON "SafetyChecklistResponse"("locationId");
CREATE INDEX IF NOT EXISTS "SafetyChecklistResponse_completedAt_idx" ON "SafetyChecklistResponse"("completedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "SafetyChecklistItemCheck_safetyChecklistResponseId_safetyChecklistItemId_key" ON "SafetyChecklistItemCheck"("safetyChecklistResponseId", "safetyChecklistItemId");
CREATE INDEX IF NOT EXISTS "SafetyChecklistItemCheck_safetyChecklistResponseId_idx" ON "SafetyChecklistItemCheck"("safetyChecklistResponseId");
CREATE INDEX IF NOT EXISTS "SafetyChecklistItemCheck_safetyChecklistItemId_idx" ON "SafetyChecklistItemCheck"("safetyChecklistItemId");

-- AddForeignKeys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SafetyChecklistResponse_dutySessionId_fkey') THEN
        ALTER TABLE "SafetyChecklistResponse" ADD CONSTRAINT "SafetyChecklistResponse_dutySessionId_fkey" FOREIGN KEY ("dutySessionId") REFERENCES "DutySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SafetyChecklistResponse_userId_fkey') THEN
        ALTER TABLE "SafetyChecklistResponse" ADD CONSTRAINT "SafetyChecklistResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SafetyChecklistResponse_locationId_fkey') THEN
        ALTER TABLE "SafetyChecklistResponse" ADD CONSTRAINT "SafetyChecklistResponse_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SafetyChecklistResponse_logId_fkey') THEN
        ALTER TABLE "SafetyChecklistResponse" ADD CONSTRAINT "SafetyChecklistResponse_logId_fkey" FOREIGN KEY ("logId") REFERENCES "Log"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SafetyChecklistItemCheck_safetyChecklistResponseId_fkey') THEN
        ALTER TABLE "SafetyChecklistItemCheck" ADD CONSTRAINT "SafetyChecklistItemCheck_safetyChecklistResponseId_fkey" FOREIGN KEY ("safetyChecklistResponseId") REFERENCES "SafetyChecklistResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SafetyChecklistItemCheck_safetyChecklistItemId_fkey') THEN
        ALTER TABLE "SafetyChecklistItemCheck" ADD CONSTRAINT "SafetyChecklistItemCheck_safetyChecklistItemId_fkey" FOREIGN KEY ("safetyChecklistItemId") REFERENCES "SafetyChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
    `

    await prisma.$executeRawUnsafe(sql)

    console.log('✅ Missing tables created successfully!')
    await prisma.$disconnect()
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating tables:', error)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  }
}

applyTables()
