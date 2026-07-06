-- AlterTable: Notification - add link column
ALTER TABLE "notifications" ADD COLUMN "link" TEXT;

-- AlterTable: NotificationPreference - add sound and vibrate columns
ALTER TABLE "notification_preferences" ADD COLUMN "sound" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN "vibrate" BOOLEAN NOT NULL DEFAULT true;
