-- Migrate legacy SupervisorEquipment (CAR/RADIO) records into the Fleet
-- Vehicle/Radio tables, then repoint SupervisorEquipmentCheckout at them.

-- 1. Migrate CAR equipment into Vehicle (reuse existing ids)
INSERT INTO "Vehicle" (id, name, make, model, year, mileage, status, "createdAt", "updatedAt")
SELECT id, identifier, 'Unknown', 'Unknown', 2024, 0, 'WORKING', "createdAt", "updatedAt"
FROM "SupervisorEquipment"
WHERE type = 'CAR';

-- 2. Migrate RADIO equipment into Radio (reuse existing ids)
INSERT INTO "Radio" (id, name, status, "createdAt", "updatedAt")
SELECT id, identifier, 'WORKING', "createdAt", "updatedAt"
FROM "SupervisorEquipment"
WHERE type = 'RADIO';

-- 3. Clear historical checkout rows (all closed test records tied to the old equipment table)
DELETE FROM "SupervisorEquipmentCheckout";

-- 4. Drop old FK, index, and column
ALTER TABLE "SupervisorEquipmentCheckout" DROP CONSTRAINT "SupervisorEquipmentCheckout_equipmentId_fkey";
DROP INDEX "SupervisorEquipmentCheckout_equipmentId_idx";
ALTER TABLE "SupervisorEquipmentCheckout" DROP COLUMN "equipmentId";

-- 5. Add new vehicle/radio FK columns
ALTER TABLE "SupervisorEquipmentCheckout" ADD COLUMN "vehicleId" TEXT;
ALTER TABLE "SupervisorEquipmentCheckout" ADD COLUMN "radioId" TEXT;

-- 6. Add foreign keys
ALTER TABLE "SupervisorEquipmentCheckout" ADD CONSTRAINT "SupervisorEquipmentCheckout_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupervisorEquipmentCheckout" ADD CONSTRAINT "SupervisorEquipmentCheckout_radioId_fkey" FOREIGN KEY ("radioId") REFERENCES "Radio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Add indexes
CREATE INDEX "SupervisorEquipmentCheckout_vehicleId_idx" ON "SupervisorEquipmentCheckout"("vehicleId");
CREATE INDEX "SupervisorEquipmentCheckout_radioId_idx" ON "SupervisorEquipmentCheckout"("radioId");

-- 8. Drop legacy table and enum
DROP TABLE "SupervisorEquipment";
DROP TYPE "SupervisorEquipmentType";
