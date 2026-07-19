-- CreateEnum
CREATE TYPE "GovernanceStage" AS ENUM ('INITIATION', 'PLANNING', 'EXECUTION', 'MONITORING', 'CLOSURE');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "governanceStage" "GovernanceStage" NOT NULL DEFAULT 'INITIATION';
