-- Business Type Layer
CREATE TABLE "business_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "business_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "business_types_slug_key" ON "business_types"("slug");

CREATE TABLE "business_type_modes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_type_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "business_type_modes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "business_type_modes_business_type_id_slug_key" ON "business_type_modes"("business_type_id", "slug");
CREATE INDEX "business_type_modes_business_type_id_idx" ON "business_type_modes"("business_type_id");
ALTER TABLE "business_type_modes" ADD CONSTRAINT "business_type_modes_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id") ON DELETE CASCADE;

CREATE TABLE "business_type_modules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_type_id" UUID NOT NULL,
    "module" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "business_type_modules_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "business_type_modules_business_type_id_module_key" ON "business_type_modules"("business_type_id", "module");
ALTER TABLE "business_type_modules" ADD CONSTRAINT "business_type_modules_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id") ON DELETE CASCADE;

CREATE TABLE "catalog_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_type_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "catalog_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalog_types_business_type_id_slug_key" ON "catalog_types"("business_type_id", "slug");
ALTER TABLE "catalog_types" ADD CONSTRAINT "catalog_types_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id") ON DELETE CASCADE;

-- Add business_type_id to businesses
ALTER TABLE "businesses" ADD COLUMN "business_type_id" UUID;
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id");

-- Add catalog_type_id to catalog_items
ALTER TABLE "catalog_items" ADD COLUMN "catalog_type_id" UUID;
CREATE INDEX "catalog_items_catalog_type_id_idx" ON "catalog_items"("catalog_type_id");
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_catalog_type_id_fkey" FOREIGN KEY ("catalog_type_id") REFERENCES "catalog_types"("id");

-- Shared Catalog Attributes
CREATE TABLE "catalog_attributes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "catalog_type_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "options" JSONB DEFAULT '[]',
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_searchable" BOOLEAN NOT NULL DEFAULT false,
    "is_filterable" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "catalog_attributes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalog_attributes_business_id_slug_key" ON "catalog_attributes"("business_id", "slug");
CREATE INDEX "catalog_attributes_business_id_idx" ON "catalog_attributes"("business_id");
CREATE INDEX "catalog_attributes_catalog_type_id_idx" ON "catalog_attributes"("catalog_type_id");
ALTER TABLE "catalog_attributes" ADD CONSTRAINT "catalog_attributes_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;
ALTER TABLE "catalog_attributes" ADD CONSTRAINT "catalog_attributes_catalog_type_id_fkey" FOREIGN KEY ("catalog_type_id") REFERENCES "catalog_types"("id");

CREATE TABLE "catalog_item_attributes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "catalog_item_id" UUID NOT NULL,
    "attribute_id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "catalog_item_attributes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalog_item_attributes_catalog_item_id_attribute_id_key" ON "catalog_item_attributes"("catalog_item_id", "attribute_id");
CREATE INDEX "catalog_item_attributes_catalog_item_id_idx" ON "catalog_item_attributes"("catalog_item_id");
CREATE INDEX "catalog_item_attributes_attribute_id_idx" ON "catalog_item_attributes"("attribute_id");
ALTER TABLE "catalog_item_attributes" ADD CONSTRAINT "catalog_item_attributes_catalog_item_id_fkey" FOREIGN KEY ("catalog_item_id") REFERENCES "catalog_items"("id") ON DELETE CASCADE;
ALTER TABLE "catalog_item_attributes" ADD CONSTRAINT "catalog_item_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "catalog_attributes"("id") ON DELETE CASCADE;

-- Shared CRM Domain
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "tax_id" TEXT,
    "website" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "organizations_business_id_idx" ON "organizations"("business_id");
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;

CREATE TABLE "contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "organization_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "contacts_business_id_idx" ON "contacts"("business_id");
CREATE INDEX "contacts_email_idx" ON "contacts"("email");
CREATE INDEX "contacts_phone_idx" ON "contacts"("phone");
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");

CREATE TABLE "addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contact_id" UUID,
    "business_id" UUID,
    "type" TEXT NOT NULL DEFAULT 'billing',
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Tanzania',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "addresses_contact_id_idx" ON "addresses"("contact_id");
CREATE INDEX "addresses_business_id_idx" ON "addresses"("business_id");
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id");

CREATE TABLE "communication_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contact_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'outbound',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "reference_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "communication_logs_contact_id_idx" ON "communication_logs"("contact_id");
CREATE INDEX "communication_logs_type_idx" ON "communication_logs"("type");
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE;

-- Add contact_id to customers
ALTER TABLE "customers" ADD COLUMN "contact_id" UUID UNIQUE;
CREATE INDEX "customers_contact_id_idx" ON "customers"("contact_id");
ALTER TABLE "customers" ADD CONSTRAINT "customers_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id");
