-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "Log" ADD COLUMN     "actionsTaken" TEXT,
ADD COLUMN     "followUpNotes" TEXT,
ADD COLUMN     "followUpRequired" BOOLEAN DEFAULT false,
ADD COLUMN     "incidentTime" TIMESTAMP(3),
ADD COLUMN     "peopleInvolved" TEXT,
ADD COLUMN     "photoUrls" TEXT,
ADD COLUMN     "severity" "IncidentSeverity",
ADD COLUMN     "weatherConditions" TEXT,
ADD COLUMN     "witnesses" TEXT;

-- CreateIndex
CREATE INDEX "Log_severity_idx" ON "Log"("severity");
