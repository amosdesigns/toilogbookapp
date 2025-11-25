-- CreateEnum for Notifications
CREATE TYPE "NotificationAction" AS ENUM ('ADDED', 'SIGNED_IN', 'DELETED', 'UPDATED');
CREATE TYPE "NotificationTarget" AS ENUM ('USER_PROFILE', 'EMAIL', 'SUPERVISOR', 'SUPERADMIN', 'GUARD', 'COMMENT');

-- CreateEnum for Assets
CREATE TYPE "AssetType" AS ENUM ('BOAT', 'VEHICLE', 'EQUIPMENT', 'FACILITY', 'OTHER');
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DAMAGED');

-- CreateEnum for Equipment
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'CHECKED_OUT', 'MAINTENANCE', 'LOST', 'DAMAGED');

-- CreateEnum for Maintenance
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum for Alerts
CREATE TYPE "AlertPriority" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable: RecurringShiftPattern
CREATE TABLE "RecurringShiftPattern" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "daysOfWeek" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringShiftPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ShiftAssignment
CREATE TABLE "ShiftAssignment" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RecurringUserAssignment
CREATE TABLE "RecurringUserAssignment" (
    "id" TEXT NOT NULL,
    "recurringPatternId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringUserAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Notification
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "action" "NotificationAction" NOT NULL,
    "target" "NotificationTarget" NOT NULL,
    "message" TEXT,
    "unread" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Asset
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "serialNumber" TEXT,
    "registrationNumber" TEXT,
    "locationId" TEXT,
    "assignedTo" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(10,2),
    "insuranceInfo" TEXT,
    "lastMaintenanceDate" TIMESTAMP(3),
    "nextMaintenanceDate" TIMESTAMP(3),
    "maintenanceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Visitor
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "purpose" TEXT,
    "locationId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP(3),
    "expectedDuration" INTEGER,
    "checkedInBy" TEXT NOT NULL,
    "checkedOutBy" TEXT,
    "vehicleMake" TEXT,
    "vehicleModel" TEXT,
    "licensePlate" TEXT,
    "badgeNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Equipment
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serialNumber" TEXT,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "locationId" TEXT,
    "checkedOutTo" TEXT,
    "checkedOutAt" TIMESTAMP(3),
    "expectedReturnAt" TIMESTAMP(3),
    "lastMaintenance" TIMESTAMP(3),
    "nextMaintenance" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MaintenanceRequest
CREATE TABLE "MaintenanceRequest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'PENDING',
    "locationId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedTo" TEXT,
    "assignedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "photoUrls" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Alert
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "AlertPriority" NOT NULL DEFAULT 'INFO',
    "locationId" TEXT,
    "targetRole" "Role",
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeUntil" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "createdBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SafetyChecklistItem
CREATE TABLE "SafetyChecklistItem" (
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
CREATE TABLE "SafetyChecklistResponse" (
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
CREATE TABLE "SafetyChecklistItemCheck" (
    "id" TEXT NOT NULL,
    "safetyChecklistResponseId" TEXT NOT NULL,
    "safetyChecklistItemId" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyChecklistItemCheck_pkey" PRIMARY KEY ("id")
);

-- Add missing column to Shift table
ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "recurringPatternId" TEXT;

-- CreateIndex
CREATE INDEX "RecurringShiftPattern_locationId_idx" ON "RecurringShiftPattern"("locationId");
CREATE INDEX "RecurringShiftPattern_isActive_idx" ON "RecurringShiftPattern"("isActive");

CREATE UNIQUE INDEX "ShiftAssignment_shiftId_userId_key" ON "ShiftAssignment"("shiftId", "userId");
CREATE INDEX "ShiftAssignment_shiftId_idx" ON "ShiftAssignment"("shiftId");
CREATE INDEX "ShiftAssignment_userId_idx" ON "ShiftAssignment"("userId");

CREATE UNIQUE INDEX "RecurringUserAssignment_recurringPatternId_userId_key" ON "RecurringUserAssignment"("recurringPatternId", "userId");
CREATE INDEX "RecurringUserAssignment_recurringPatternId_idx" ON "RecurringUserAssignment"("recurringPatternId");
CREATE INDEX "RecurringUserAssignment_userId_idx" ON "RecurringUserAssignment"("userId");

CREATE INDEX "notifications_user_idx" ON "notifications"("user");
CREATE INDEX "notifications_unread_idx" ON "notifications"("unread");

CREATE UNIQUE INDEX "Asset_serialNumber_key" ON "Asset"("serialNumber");
CREATE INDEX "Asset_locationId_idx" ON "Asset"("locationId");
CREATE INDEX "Asset_type_idx" ON "Asset"("type");
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

CREATE INDEX "Visitor_locationId_idx" ON "Visitor"("locationId");
CREATE INDEX "Visitor_checkInTime_idx" ON "Visitor"("checkInTime");
CREATE INDEX "Visitor_email_idx" ON "Visitor"("email");
CREATE INDEX "Visitor_licensePlate_idx" ON "Visitor"("licensePlate");

CREATE UNIQUE INDEX "Equipment_serialNumber_key" ON "Equipment"("serialNumber");
CREATE INDEX "Equipment_locationId_idx" ON "Equipment"("locationId");
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");
CREATE INDEX "Equipment_checkedOutTo_idx" ON "Equipment"("checkedOutTo");

CREATE INDEX "MaintenanceRequest_locationId_idx" ON "MaintenanceRequest"("locationId");
CREATE INDEX "MaintenanceRequest_status_idx" ON "MaintenanceRequest"("status");
CREATE INDEX "MaintenanceRequest_priority_idx" ON "MaintenanceRequest"("priority");
CREATE INDEX "MaintenanceRequest_reportedBy_idx" ON "MaintenanceRequest"("reportedBy");
CREATE INDEX "MaintenanceRequest_assignedTo_idx" ON "MaintenanceRequest"("assignedTo");

CREATE INDEX "Alert_locationId_idx" ON "Alert"("locationId");
CREATE INDEX "Alert_priority_idx" ON "Alert"("priority");
CREATE INDEX "Alert_isActive_idx" ON "Alert"("isActive");
CREATE INDEX "Alert_activeFrom_activeUntil_idx" ON "Alert"("activeFrom", "activeUntil");

CREATE UNIQUE INDEX "SafetyChecklistItem_name_key" ON "SafetyChecklistItem"("name");
CREATE INDEX "SafetyChecklistItem_isActive_idx" ON "SafetyChecklistItem"("isActive");
CREATE INDEX "SafetyChecklistItem_order_idx" ON "SafetyChecklistItem"("order");

CREATE UNIQUE INDEX "SafetyChecklistResponse_logId_key" ON "SafetyChecklistResponse"("logId");
CREATE INDEX "SafetyChecklistResponse_dutySessionId_idx" ON "SafetyChecklistResponse"("dutySessionId");
CREATE INDEX "SafetyChecklistResponse_userId_idx" ON "SafetyChecklistResponse"("userId");
CREATE INDEX "SafetyChecklistResponse_locationId_idx" ON "SafetyChecklistResponse"("locationId");
CREATE INDEX "SafetyChecklistResponse_completedAt_idx" ON "SafetyChecklistResponse"("completedAt");

CREATE UNIQUE INDEX "SafetyChecklistItemCheck_safetyChecklistResponseId_safetyChecklistItemId_key" ON "SafetyChecklistItemCheck"("safetyChecklistResponseId", "safetyChecklistItemId");
CREATE INDEX "SafetyChecklistItemCheck_safetyChecklistResponseId_idx" ON "SafetyChecklistItemCheck"("safetyChecklistResponseId");
CREATE INDEX "SafetyChecklistItemCheck_safetyChecklistItemId_idx" ON "SafetyChecklistItemCheck"("safetyChecklistItemId");

CREATE INDEX "Shift_recurringPatternId_idx" ON "Shift"("recurringPatternId");

-- AddForeignKey
ALTER TABLE "RecurringShiftPattern" ADD CONSTRAINT "RecurringShiftPattern_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Shift" ADD CONSTRAINT "Shift_recurringPatternId_fkey" FOREIGN KEY ("recurringPatternId") REFERENCES "RecurringShiftPattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecurringUserAssignment" ADD CONSTRAINT "RecurringUserAssignment_recurringPatternId_fkey" FOREIGN KEY ("recurringPatternId") REFERENCES "RecurringShiftPattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringUserAssignment" ADD CONSTRAINT "RecurringUserAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Asset" ADD CONSTRAINT "Asset_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Alert" ADD CONSTRAINT "Alert_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SafetyChecklistResponse" ADD CONSTRAINT "SafetyChecklistResponse_dutySessionId_fkey" FOREIGN KEY ("dutySessionId") REFERENCES "DutySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SafetyChecklistResponse" ADD CONSTRAINT "SafetyChecklistResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SafetyChecklistResponse" ADD CONSTRAINT "SafetyChecklistResponse_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SafetyChecklistResponse" ADD CONSTRAINT "SafetyChecklistResponse_logId_fkey" FOREIGN KEY ("logId") REFERENCES "Log"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SafetyChecklistItemCheck" ADD CONSTRAINT "SafetyChecklistItemCheck_safetyChecklistResponseId_fkey" FOREIGN KEY ("safetyChecklistResponseId") REFERENCES "SafetyChecklistResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SafetyChecklistItemCheck" ADD CONSTRAINT "SafetyChecklistItemCheck_safetyChecklistItemId_fkey" FOREIGN KEY ("safetyChecklistItemId") REFERENCES "SafetyChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
