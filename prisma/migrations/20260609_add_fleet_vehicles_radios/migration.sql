-- CreateEnum
CREATE TYPE "FleetStatus" AS ENUM ('WORKING', 'OUT_OF_SERVICE', 'RETIRED');

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "vin" TEXT,
    "licensePlate" TEXT,
    "mileage" INTEGER NOT NULL DEFAULT 0,
    "mileageUpdatedAt" TIMESTAMP(3),
    "status" "FleetStatus" NOT NULL DEFAULT 'WORKING',
    "locationId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Radio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT,
    "model" TEXT,
    "channel" TEXT,
    "status" "FleetStatus" NOT NULL DEFAULT 'WORKING',
    "locationId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Radio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");
CREATE INDEX "Vehicle_locationId_idx" ON "Vehicle"("locationId");
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Radio_serialNumber_key" ON "Radio"("serialNumber");
CREATE INDEX "Radio_locationId_idx" ON "Radio"("locationId");
CREATE INDEX "Radio_status_idx" ON "Radio"("status");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Radio" ADD CONSTRAINT "Radio_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
