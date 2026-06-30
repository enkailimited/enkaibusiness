-- Add status column to businesses table
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';
