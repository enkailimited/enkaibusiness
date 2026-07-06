-- CreateTable: Territory
CREATE TABLE "territories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target_revenue" DECIMAL(15,2),
    "market_size" INTEGER,
    "color" TEXT DEFAULT '#3b82f6',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "territories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "territories_name_idx" ON "territories" ("name");
CREATE INDEX "territories_is_active_idx" ON "territories" ("is_active");

-- CreateTable: TerritoryAssignment
CREATE TABLE "territory_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "territory_id" UUID NOT NULL,
    "sales_profile_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "territory_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "territory_assignments_territory_id_sales_profile_id_key" ON "territory_assignments" ("territory_id", "sales_profile_id");
CREATE INDEX "territory_assignments_territory_id_idx" ON "territory_assignments" ("territory_id");
CREATE INDEX "territory_assignments_sales_profile_id_idx" ON "territory_assignments" ("sales_profile_id");

ALTER TABLE "territory_assignments" ADD CONSTRAINT "territory_assignments_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "territories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "territory_assignments" ADD CONSTRAINT "territory_assignments_sales_profile_id_fkey" FOREIGN KEY ("sales_profile_id") REFERENCES "sales_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Lead - add location and territory_id
ALTER TABLE "leads" ADD COLUMN "location" TEXT;
ALTER TABLE "leads" ADD COLUMN "territory_id" UUID;

CREATE INDEX "leads_territory_id_idx" ON "leads" ("territory_id");

ALTER TABLE "leads" ADD CONSTRAINT "leads_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
