-- ============================================================================
-- TOI Marina Guard Logbook - Complete Database Setup
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- MIGRATION 1: Initial Schema
-- ============================================================================

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'GUARD');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('LIVE', 'UPDATED', 'ARCHIVED', 'DRAFT');

-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('INCIDENT', 'PATROL', 'VISITOR_CHECKIN', 'MAINTENANCE', 'WEATHER', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
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

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
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

-- CreateTable
CREATE TABLE "Log" (
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

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");
CREATE INDEX "User_email_idx" ON "User"("email");

CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");
CREATE INDEX "Location_name_idx" ON "Location"("name");

CREATE INDEX "Shift_locationId_idx" ON "Shift"("locationId");
CREATE INDEX "Shift_supervisorId_idx" ON "Shift"("supervisorId");
CREATE INDEX "Shift_startTime_endTime_idx" ON "Shift"("startTime", "endTime");

CREATE INDEX "Log_locationId_idx" ON "Log"("locationId");
CREATE INDEX "Log_shiftId_idx" ON "Log"("shiftId");
CREATE INDEX "Log_userId_idx" ON "Log"("userId");
CREATE INDEX "Log_type_idx" ON "Log"("type");
CREATE INDEX "Log_status_idx" ON "Log"("status");
CREATE INDEX "Log_createdAt_idx" ON "Log"("createdAt");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Log" ADD CONSTRAINT "Log_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Log" ADD CONSTRAINT "Log_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Log" ADD CONSTRAINT "Log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- MIGRATION 2: Incident Report Fields
-- ============================================================================

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "Log" ADD COLUMN "actionsTaken" TEXT;
ALTER TABLE "Log" ADD COLUMN "followUpNotes" TEXT;
ALTER TABLE "Log" ADD COLUMN "followUpRequired" BOOLEAN DEFAULT false;
ALTER TABLE "Log" ADD COLUMN "incidentTime" TIMESTAMP(3);
ALTER TABLE "Log" ADD COLUMN "peopleInvolved" TEXT;
ALTER TABLE "Log" ADD COLUMN "photoUrls" TEXT;
ALTER TABLE "Log" ADD COLUMN "severity" "IncidentSeverity";
ALTER TABLE "Log" ADD COLUMN "weatherConditions" TEXT;
ALTER TABLE "Log" ADD COLUMN "witnesses" TEXT;

-- CreateIndex
CREATE INDEX "Log_severity_idx" ON "Log"("severity");


-- MIGRATION 3: Duty Sessions and Location Check-ins
-- ============================================================================

-- AlterTable
ALTER TABLE "Log" ADD COLUMN "reviewNotes" TEXT;
ALTER TABLE "Log" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Log" ADD COLUMN "reviewedBy" TEXT;

-- CreateTable
CREATE TABLE "DutySession" (
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

-- CreateTable
CREATE TABLE "LocationCheckIn" (
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

-- CreateIndex
CREATE INDEX "DutySession_userId_idx" ON "DutySession"("userId");
CREATE INDEX "DutySession_locationId_idx" ON "DutySession"("locationId");
CREATE INDEX "DutySession_clockInTime_idx" ON "DutySession"("clockInTime");
CREATE INDEX "DutySession_clockOutTime_idx" ON "DutySession"("clockOutTime");

CREATE INDEX "LocationCheckIn_dutySessionId_idx" ON "LocationCheckIn"("dutySessionId");
CREATE INDEX "LocationCheckIn_locationId_idx" ON "LocationCheckIn"("locationId");
CREATE INDEX "LocationCheckIn_userId_idx" ON "LocationCheckIn"("userId");
CREATE INDEX "LocationCheckIn_checkInTime_idx" ON "LocationCheckIn"("checkInTime");

CREATE INDEX "Log_reviewedBy_idx" ON "Log"("reviewedBy");

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DutySession" ADD CONSTRAINT "DutySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DutySession" ADD CONSTRAINT "DutySession_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DutySession" ADD CONSTRAINT "DutySession_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LocationCheckIn" ADD CONSTRAINT "LocationCheckIn_dutySessionId_fkey" FOREIGN KEY ("dutySessionId") REFERENCES "DutySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LocationCheckIn" ADD CONSTRAINT "LocationCheckIn_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LocationCheckIn" ADD CONSTRAINT "LocationCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- Setup Complete!
-- ============================================================================
-- Next step: Run the seed script with: npm run db:seed
-- ============================================================================
