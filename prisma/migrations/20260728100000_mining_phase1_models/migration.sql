-- Add MINING to Industry enum
ALTER TYPE "Industry" ADD VALUE IF NOT EXISTS 'MINING';

-- Add mining-related CatalogItemTypes
ALTER TYPE "CatalogItemType" ADD VALUE IF NOT EXISTS 'MINERAL';
ALTER TYPE "CatalogItemType" ADD VALUE IF NOT EXISTS 'ORE';
ALTER TYPE "CatalogItemType" ADD VALUE IF NOT EXISTS 'EQUIPMENT';

-- Create Mining enums
DO $$ BEGIN
  CREATE TYPE "MiningSiteStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DEPLETED', 'ON_HOLD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MiningLicenseStatus" AS ENUM ('ACTIVE', 'PENDING', 'EXPIRED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MiningEquipmentStatus" AS ENUM ('OPERATIONAL', 'MAINTENANCE', 'REPAIR', 'RETIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FuelType" AS ENUM ('DIESEL', 'PETROL', 'LUBRICANT', 'GREASE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create mining_sites table
CREATE TABLE IF NOT EXISTS "mining_sites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "coordinates" TEXT,
    "size" DECIMAL(15,2),
    "size_unit" TEXT,
    "mineral_type" TEXT,
    "status" "MiningSiteStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mining_sites_pkey" PRIMARY KEY ("id")
);

-- Create mining_licenses table
CREATE TABLE IF NOT EXISTS "mining_licenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "site_id" UUID,
    "license_number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "issuing_body" TEXT,
    "status" "MiningLicenseStatus" NOT NULL DEFAULT 'PENDING',
    "issue_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "description" TEXT,
    "document_url" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mining_licenses_pkey" PRIMARY KEY ("id")
);

-- Create mining_equipment table
CREATE TABLE IF NOT EXISTS "mining_equipment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "site_id" UUID,
    "name" TEXT NOT NULL,
    "equipment_type" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "serial_number" TEXT,
    "year" INTEGER,
    "status" "MiningEquipmentStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "purchase_date" TIMESTAMP(3),
    "purchase_price" DECIMAL(15,2),
    "fuel_type" "FuelType" NOT NULL DEFAULT 'DIESEL',
    "fuel_capacity" DECIMAL(10,2),
    "hourly_fuel_usage" DECIMAL(10,2),
    "last_maintenance" TIMESTAMP(3),
    "next_maintenance" TIMESTAMP(3),
    "meter_reading" DECIMAL(15,2) DEFAULT 0,
    "meter_unit" TEXT,
    "image_url" TEXT,
    "notes" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mining_equipment_pkey" PRIMARY KEY ("id")
);

-- Create fuel_transactions table
CREATE TABLE IF NOT EXISTS "fuel_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "site_id" UUID,
    "equipment_id" UUID,
    "fuel_type" "FuelType" NOT NULL DEFAULT 'DIESEL',
    "quantity" DECIMAL(15,2) NOT NULL,
    "unit_cost" DECIMAL(15,2),
    "total_cost" DECIMAL(15,2),
    "supplier" TEXT,
    "receipt_ref" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fuel_transactions_pkey" PRIMARY KEY ("id")
);

-- Create mining_production_logs table
CREATE TABLE IF NOT EXISTS "mining_production_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "site_id" UUID,
    "catalog_item_id" UUID,
    "production_date" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(15,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'tonnes',
    "grade" DECIMAL(10,2),
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mining_production_logs_pkey" PRIMARY KEY ("id")
);

-- Create mining_service_logs table
CREATE TABLE IF NOT EXISTS "mining_service_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "service_type" TEXT NOT NULL,
    "description" TEXT,
    "service_date" TIMESTAMP(3) NOT NULL,
    "cost" DECIMAL(15,2),
    "meter_at_service" DECIMAL(15,2),
    "next_service_date" TIMESTAMP(3),
    "next_service_meter" DECIMAL(15,2),
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mining_service_logs_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_mining_sites_business" ON "mining_sites"("business_id");
CREATE INDEX IF NOT EXISTS "idx_mining_sites_status" ON "mining_sites"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mining_licenses_business_number" ON "mining_licenses"("business_id", "license_number");
CREATE INDEX IF NOT EXISTS "idx_mining_licenses_business" ON "mining_licenses"("business_id");
CREATE INDEX IF NOT EXISTS "idx_mining_licenses_site" ON "mining_licenses"("site_id");
CREATE INDEX IF NOT EXISTS "idx_mining_licenses_status" ON "mining_licenses"("status");
CREATE INDEX IF NOT EXISTS "idx_mining_equipment_business" ON "mining_equipment"("business_id");
CREATE INDEX IF NOT EXISTS "idx_mining_equipment_site" ON "mining_equipment"("site_id");
CREATE INDEX IF NOT EXISTS "idx_mining_equipment_status" ON "mining_equipment"("status");
CREATE INDEX IF NOT EXISTS "idx_mining_equipment_type" ON "mining_equipment"("equipment_type");
CREATE INDEX IF NOT EXISTS "idx_fuel_txns_business" ON "fuel_transactions"("business_id");
CREATE INDEX IF NOT EXISTS "idx_fuel_txns_site" ON "fuel_transactions"("site_id");
CREATE INDEX IF NOT EXISTS "idx_fuel_txns_equipment" ON "fuel_transactions"("equipment_id");
CREATE INDEX IF NOT EXISTS "idx_fuel_txns_type" ON "fuel_transactions"("fuel_type");
CREATE INDEX IF NOT EXISTS "idx_fuel_txns_date" ON "fuel_transactions"("transaction_date");
CREATE INDEX IF NOT EXISTS "idx_production_logs_business" ON "mining_production_logs"("business_id");
CREATE INDEX IF NOT EXISTS "idx_production_logs_site" ON "mining_production_logs"("site_id");
CREATE INDEX IF NOT EXISTS "idx_production_logs_date" ON "mining_production_logs"("production_date");
CREATE INDEX IF NOT EXISTS "idx_service_logs_business" ON "mining_service_logs"("business_id");
CREATE INDEX IF NOT EXISTS "idx_service_logs_equipment" ON "mining_service_logs"("equipment_id");
CREATE INDEX IF NOT EXISTS "idx_service_logs_date" ON "mining_service_logs"("service_date");

-- Add foreign keys
ALTER TABLE "mining_sites" ADD CONSTRAINT "fk_mining_sites_business" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;
ALTER TABLE "mining_sites" ADD CONSTRAINT "fk_mining_sites_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "mining_licenses" ADD CONSTRAINT "fk_mining_licenses_business" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;
ALTER TABLE "mining_licenses" ADD CONSTRAINT "fk_mining_licenses_site" FOREIGN KEY ("site_id") REFERENCES "mining_sites"("id");
ALTER TABLE "mining_licenses" ADD CONSTRAINT "fk_mining_licenses_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "mining_equipment" ADD CONSTRAINT "fk_mining_equipment_business" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;
ALTER TABLE "mining_equipment" ADD CONSTRAINT "fk_mining_equipment_site" FOREIGN KEY ("site_id") REFERENCES "mining_sites"("id");
ALTER TABLE "mining_equipment" ADD CONSTRAINT "fk_mining_equipment_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "fuel_transactions" ADD CONSTRAINT "fk_fuel_txns_business" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;
ALTER TABLE "fuel_transactions" ADD CONSTRAINT "fk_fuel_txns_site" FOREIGN KEY ("site_id") REFERENCES "mining_sites"("id");
ALTER TABLE "fuel_transactions" ADD CONSTRAINT "fk_fuel_txns_equipment" FOREIGN KEY ("equipment_id") REFERENCES "mining_equipment"("id");
ALTER TABLE "fuel_transactions" ADD CONSTRAINT "fk_fuel_txns_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "mining_production_logs" ADD CONSTRAINT "fk_production_logs_business" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;
ALTER TABLE "mining_production_logs" ADD CONSTRAINT "fk_production_logs_site" FOREIGN KEY ("site_id") REFERENCES "mining_sites"("id");
ALTER TABLE "mining_production_logs" ADD CONSTRAINT "fk_production_logs_catalog" FOREIGN KEY ("catalog_item_id") REFERENCES "catalog_items"("id");
ALTER TABLE "mining_production_logs" ADD CONSTRAINT "fk_production_logs_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "mining_service_logs" ADD CONSTRAINT "fk_service_logs_business" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;
ALTER TABLE "mining_service_logs" ADD CONSTRAINT "fk_service_logs_equipment" FOREIGN KEY ("equipment_id") REFERENCES "mining_equipment"("id");
ALTER TABLE "mining_service_logs" ADD CONSTRAINT "fk_service_logs_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id");
