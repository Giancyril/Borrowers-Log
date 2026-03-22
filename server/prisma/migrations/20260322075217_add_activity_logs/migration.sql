-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CREATED', 'UPDATED', 'RETURNED', 'DELETED', 'BULK_RETURNED', 'BULK_DELETED', 'LOGIN', 'REGISTERED', 'CHANGED_PASSWORD', 'CHANGED_EMAIL', 'CHANGED_USERNAME');

-- CreateTable
CREATE TABLE "activityLogs" (
    "id" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "details" TEXT NOT NULL DEFAULT '',
    "adminId" TEXT,
    "adminName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activityLogs_pkey" PRIMARY KEY ("id")
);
