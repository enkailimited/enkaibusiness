-- AlterEnum: Add new pipeline stages to LeadStatus
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'APPOINTMENT_SET';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'PROPOSAL';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'REGISTERED';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'INSTALLED';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'ACTIVE';

-- CreateEnum: WeeklyReportStatus
CREATE TYPE "WeeklyReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED');

-- CreateTable: WeeklyReport
CREATE TABLE IF NOT EXISTS "weekly_reports" (
    "id" UUID NOT NULL,
    "sales_profile_id" UUID NOT NULL,
    "week_start" TIMESTAMP(3) NOT NULL,
    "leads_contacted" INTEGER NOT NULL DEFAULT 0,
    "demos_done" INTEGER NOT NULL DEFAULT 0,
    "registrations" INTEGER NOT NULL DEFAULT 0,
    "challenges" TEXT,
    "next_plan" TEXT,
    "status" "WeeklyReportStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewed_by" UUID,
    "review_notes" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "weekly_reports_sales_profile_id_week_start_key" ON "weekly_reports"("sales_profile_id", "week_start");
CREATE INDEX IF NOT EXISTS "weekly_reports_sales_profile_id_idx" ON "weekly_reports"("sales_profile_id");
CREATE INDEX IF NOT EXISTS "weekly_reports_week_start_idx" ON "weekly_reports"("week_start");

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_sales_profile_id_fkey" FOREIGN KEY ("sales_profile_id") REFERENCES "sales_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
