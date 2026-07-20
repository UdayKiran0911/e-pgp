/*
  Warnings:

  - Made the column `hash` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "hash" SET NOT NULL;
