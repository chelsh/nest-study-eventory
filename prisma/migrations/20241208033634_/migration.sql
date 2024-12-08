/*
  Warnings:

  - Made the column `is_archive_event` on table `event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "event" ALTER COLUMN "is_archive_event" SET NOT NULL;
