-- Add nida and address columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nida" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" TEXT NOT NULL DEFAULT '';

-- CreateTable: Guarantor (if not exists)
CREATE TABLE IF NOT EXISTS "guarantors" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "guarantors_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "guarantors_user_id_key" ON "guarantors"("user_id");

-- AddForeignKey
ALTER TABLE "guarantors" ADD CONSTRAINT "guarantors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: UserDocument
CREATE TABLE IF NOT EXISTS "user_documents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_documents_user_id_idx" ON "user_documents"("user_id");

-- AddForeignKey
ALTER TABLE "user_documents" ADD CONSTRAINT "user_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
