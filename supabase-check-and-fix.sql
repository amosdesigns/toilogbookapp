-- ============================================================================
-- Check Existing Database State and Create Missing Objects
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, let's see what types already exist
-- Run this query to see existing enums:
-- SELECT t.typname as enum_name
-- FROM pg_type t
-- JOIN pg_enum e ON t.oid = e.enumtypid
-- GROUP BY t.typname;

-- Create enums ONLY if they don't exist
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'GUARD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RecordStatus" AS ENUM ('LIVE', 'UPDATED', 'ARCHIVED', 'DRAFT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "LogType" AS ENUM ('INCIDENT', 'PATROL', 'VISITOR_CHECKIN', 'MAINTENANCE', 'WEATHER', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tables ONLY if they don't exist
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "Role" NOT NULL DEFAULT 'GUARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Shift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT NOT NULL,
    "supervisorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Log" (
    "id" TEXT NOT NULL,
    "type" "LogType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'LIVE',
    "locationId" TEXT NOT NULL,
    "shiftId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    -- Incident fields
    "actionsTaken" TEXT,
    "followUpNotes" TEXT,
    "followUpRequired" BOOLEAN DEFAULT false,
    "incidentTime" TIMESTAMP(3),
    "peopleInvolved" TEXT,
    "photoUrls" TEXT,
    "severity" "IncidentSeverity",
    "weatherConditions" TEXT,
    "witnesses" TEXT,
    -- Review fields
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DutySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT,
    "shiftId" TEXT,
    "clockInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clockOutTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DutySession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LocationCheckIn" (
    "id" TEXT NOT NULL,
    "dutySessionId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LocationCheckIn_pkey" PRIMARY KEY ("id")
);

-- Create indexes (IF NOT EXISTS supported in PostgreSQL 9.5+)
CREATE UNIQUE INDEX IF NOT EXISTS "User_clerkId_key" ON "User"("clerkId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_clerkId_idx" ON "User"("clerkId");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

CREATE UNIQUE INDEX IF NOT EXISTS "Location_name_key" ON "Location"("name");
CREATE INDEX IF NOT EXISTS "Location_name_idx" ON "Location"("name");

CREATE INDEX IF NOT EXISTS "Shift_locationId_idx" ON "Shift"("locationId");
CREATE INDEX IF NOT EXISTS "Shift_supervisorId_idx" ON "Shift"("supervisorId");
CREATE INDEX IF NOT EXISTS "Shift_startTime_endTime_idx" ON "Shift"("startTime", "endTime");

CREATE INDEX IF NOT EXISTS "Log_locationId_idx" ON "Log"("locationId");
CREATE INDEX IF NOT EXISTS "Log_shiftId_idx" ON "Log"("shiftId");
CREATE INDEX IF NOT EXISTS "Log_userId_idx" ON "Log"("userId");
CREATE INDEX IF NOT EXISTS "Log_type_idx" ON "Log"("type");
CREATE INDEX IF NOT EXISTS "Log_status_idx" ON "Log"("status");
CREATE INDEX IF NOT EXISTS "Log_createdAt_idx" ON "Log"("createdAt");
CREATE INDEX IF NOT EXISTS "Log_severity_idx" ON "Log"("severity");
CREATE INDEX IF NOT EXISTS "Log_reviewedBy_idx" ON "Log"("reviewedBy");

CREATE INDEX IF NOT EXISTS "DutySession_userId_idx" ON "DutySession"("userId");
CREATE INDEX IF NOT EXISTS "DutySession_locationId_idx" ON "DutySession"("locationId");
CREATE INDEX IF NOT EXISTS "DutySession_clockInTime_idx" ON "DutySession"("clockInTime");
CREATE INDEX IF NOT EXISTS "DutySession_clockOutTime_idx" ON "DutySession"("clockOutTime");

CREATE INDEX IF NOT EXISTS "LocationCheckIn_dutySessionId_idx" ON "LocationCheckIn"("dutySessionId");
CREATE INDEX IF NOT EXISTS "LocationCheckIn_locationId_idx" ON "LocationCheckIn"("locationId");
CREATE INDEX IF NOT EXISTS "LocationCheckIn_userId_idx" ON "LocationCheckIn"("userId");
CREATE INDEX IF NOT EXISTS "LocationCheckIn_checkInTime_idx" ON "LocationCheckIn"("checkInTime");

-- Add foreign key constraints (only if they don't exist)
DO $$ BEGIN
    ALTER TABLE "Shift" ADD CONSTRAINT "Shift_locationId_fkey"
        FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Shift" ADD CONSTRAINT "Shift_supervisorId_fkey"
        FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Log" ADD CONSTRAINT "Log_locationId_fkey"
        FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Log" ADD CONSTRAINT "Log_shiftId_fkey"
        FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Log" ADD CONSTRAINT "Log_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Log" ADD CONSTRAINT "Log_reviewedBy_fkey"
        FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "DutySession" ADD CONSTRAINT "DutySession_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "DutySession" ADD CONSTRAINT "DutySession_locationId_fkey"
        FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "DutySession" ADD CONSTRAINT "DutySession_shiftId_fkey"
        FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "LocationCheckIn" ADD CONSTRAINT "LocationCheckIn_dutySessionId_fkey"
        FOREIGN KEY ("dutySessionId") REFERENCES "DutySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "LocationCheckIn" ADD CONSTRAINT "LocationCheckIn_locationId_fkey"
        FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "LocationCheckIn" ADD CONSTRAINT "LocationCheckIn_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- Setup Complete!
-- ============================================================================
