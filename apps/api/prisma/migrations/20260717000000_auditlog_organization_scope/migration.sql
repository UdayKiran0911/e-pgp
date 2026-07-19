-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_projectId_fkey";

-- AlterTable: add organizationId as nullable first (existing rows need a value)
ALTER TABLE "AuditLog" ADD COLUMN     "organizationId" TEXT,
ALTER COLUMN "projectId" DROP NOT NULL;

-- Backfill organizationId for existing rows from their linked Project
UPDATE "AuditLog" AS al
SET "organizationId" = p."organizationId"
FROM "Project" AS p
WHERE al."projectId" = p."id" AND al."organizationId" IS NULL;

-- Now that every row has a value, enforce NOT NULL
ALTER TABLE "AuditLog" ALTER COLUMN "organizationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
