-- AlterTable
ALTER TABLE "Log" ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT;

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

-- CreateIndex
CREATE INDEX "DutySession_locationId_idx" ON "DutySession"("locationId");

-- CreateIndex
CREATE INDEX "DutySession_clockInTime_idx" ON "DutySession"("clockInTime");

-- CreateIndex
CREATE INDEX "DutySession_clockOutTime_idx" ON "DutySession"("clockOutTime");

-- CreateIndex
CREATE INDEX "LocationCheckIn_dutySessionId_idx" ON "LocationCheckIn"("dutySessionId");

-- CreateIndex
CREATE INDEX "LocationCheckIn_locationId_idx" ON "LocationCheckIn"("locationId");

-- CreateIndex
CREATE INDEX "LocationCheckIn_userId_idx" ON "LocationCheckIn"("userId");

-- CreateIndex
CREATE INDEX "LocationCheckIn_checkInTime_idx" ON "LocationCheckIn"("checkInTime");

-- CreateIndex
CREATE INDEX "Log_reviewedBy_idx" ON "Log"("reviewedBy");

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutySession" ADD CONSTRAINT "DutySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutySession" ADD CONSTRAINT "DutySession_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutySession" ADD CONSTRAINT "DutySession_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationCheckIn" ADD CONSTRAINT "LocationCheckIn_dutySessionId_fkey" FOREIGN KEY ("dutySessionId") REFERENCES "DutySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationCheckIn" ADD CONSTRAINT "LocationCheckIn_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationCheckIn" ADD CONSTRAINT "LocationCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
