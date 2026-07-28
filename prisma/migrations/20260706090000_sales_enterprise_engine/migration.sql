-- CreateEnum
CREATE TYPE "RuleCalculationType" AS ENUM ('FLAT', 'PERCENTAGE', 'FORMULA', 'TIERED', 'HYBRID');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('COMMISSION', 'BONUS', 'INCENTIVE', 'DISCOUNT', 'PROMOTION');

-- CreateEnum
CREATE TYPE "CommissionTriggerEvent" AS ENUM ('BUSINESS_REGISTRATION', 'SUBSCRIPTION_ACTIVATION', 'FIRST_PAYMENT', 'SUBSCRIPTION_RENEWAL', 'ANNUAL_RENEWAL', 'INSTALLATION', 'TRAINING', 'VERIFICATION', 'REFERRAL', 'UPSELL', 'CROSS_SELL', 'ADDON_PURCHASE', 'CUSTOMER_RETENTION', 'CUSTOMER_SUCCESS', 'BUSINESS_EXPANSION', 'BRANCH_EXPANSION', 'QR_ACTIVATION', 'CAMPAIGN_BONUS', 'SEASONAL_BONUS', 'REFERRAL_CHAIN', 'HIERARCHY_OVERRIDE');

-- CreateEnum
CREATE TYPE "PayoutMethodType" AS ENUM ('BANK', 'MOBILE_MONEY', 'WALLET', 'CASH');

-- CreateEnum
CREATE TYPE "KpiPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "TargetPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "InstallerStatus" AS ENUM ('AVAILABLE', 'BUSY', 'TRAVELING', 'OFFLINE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "InstallationServiceType" AS ENUM ('QR_EXPERIENCE', 'STOREFRONT', 'CUSTOMER_APP', 'DIGITAL_MENU', 'HEALTHCARE_QUEUE', 'SCHOOL_PARENT_PORTAL', 'RESTAURANT_QR_ORDERING', 'RETAIL_QR_ORDERING', 'APPOINTMENT_QR', 'BOOKING_QR', 'SELF_CHECKIN', 'KIOSK', 'DIGITAL_CATALOG', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CommissionLedgerStatus" ADD VALUE 'REJECTED';
ALTER TYPE "CommissionLedgerStatus" ADD VALUE 'CLAWBACK';
ALTER TYPE "CommissionLedgerStatus" ADD VALUE 'ADJUSTMENT';
ALTER TYPE "CommissionLedgerStatus" ADD VALUE 'PARTIAL';

-- AlterTable
ALTER TABLE "commission_ledger" ADD COLUMN     "adjusted_by" UUID,
ADD COLUMN     "adjustment_reason" TEXT,
ADD COLUMN     "payment_reference" TEXT,
ADD COLUMN     "payout_method_id" UUID;

-- Create installation_tickets if missing (needed for clean shadow DB replay)
CREATE TABLE IF NOT EXISTS "installation_tickets" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "branch_id" UUID,
    "ticket_number" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NEW_BUSINESS',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "distributor_id" UUID,
    "requested_by" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3),
    "site_visit_date" TIMESTAMP(3),
    "site_visit_notes" TEXT,
    "verification_notes" TEXT,
    "owner_approved" BOOLEAN NOT NULL DEFAULT false,
    "owner_approved_at" TIMESTAMP(3),
    "activated_at" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "installation_tickets_pkey" PRIMARY KEY ("id")
);

-- AlterTable (safe: columns may already exist)
ALTER TABLE "installation_tickets" ADD COLUMN IF NOT EXISTS "customer_signed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "installation_tickets" ADD COLUMN IF NOT EXISTS "customer_signed_at" TIMESTAMP(3);
ALTER TABLE "installation_tickets" ADD COLUMN IF NOT EXISTS "go_live_at" TIMESTAMP(3);
ALTER TABLE "installation_tickets" ADD COLUMN IF NOT EXISTS "installer_id" UUID;
ALTER TABLE "installation_tickets" ADD COLUMN IF NOT EXISTS "package_id" UUID;

-- CreateTable
CREATE TABLE "commission_rules_v2" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger_event" "CommissionTriggerEvent" NOT NULL,
    "rule_type" "RuleType" NOT NULL,
    "industry" "Industry",
    "business_mode_id" UUID,
    "subscription_plan_id" UUID,
    "installation_package_id" UUID,
    "min_revenue" DECIMAL(15,2),
    "max_revenue" DECIMAL(15,2),
    "min_branches" INTEGER,
    "max_branches" INTEGER,
    "min_customers" INTEGER,
    "max_customers" INTEGER,
    "min_catalog_items" INTEGER,
    "max_catalog_items" INTEGER,
    "tiers" JSONB DEFAULT '[]',
    "formula" TEXT,
    "hybridConfig" JSONB DEFAULT '{}',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "effective_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_rules_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_distribution_rules" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "participant_type" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "fixedAmount" DECIMAL(15,2),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_distribution_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_commission_configs" (
    "id" UUID NOT NULL,
    "sales_profile_id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "rule_id" UUID NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_paid_date" TIMESTAMP(3),
    "next_due_date" TIMESTAMP(3),
    "total_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_commission_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installation_packages" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "industries" JSONB NOT NULL DEFAULT '[]',
    "supported_modes" JSONB DEFAULT '[]',
    "min_branches" INTEGER,
    "max_branches" INTEGER,
    "min_qr_codes" INTEGER,
    "max_qr_codes" INTEGER,
    "training_hours" INTEGER,
    "installation_hours" INTEGER,
    "branding_included" BOOLEAN NOT NULL DEFAULT false,
    "printer_included" BOOLEAN NOT NULL DEFAULT false,
    "marketing_kit_included" BOOLEAN NOT NULL DEFAULT false,
    "verification_included" BOOLEAN NOT NULL DEFAULT false,
    "support_period_days" INTEGER,
    "base_fee" DECIMAL(15,2),
    "price_per_branch" DECIMAL(15,2),
    "price_per_qr_code" DECIMAL(15,2),
    "price_per_training_hour" DECIMAL(15,2),
    "branding_fee" DECIMAL(15,2),
    "printer_fee" DECIMAL(15,2),
    "pricing_formula" TEXT,
    "price" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installation_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installation_ticket_packages" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "calculated_price" DECIMAL(15,2) NOT NULL,
    "pricing_breakdown" JSONB NOT NULL DEFAULT '{}',
    "customer_approved" BOOLEAN NOT NULL DEFAULT false,
    "qr_experience_enabled" BOOLEAN NOT NULL DEFAULT false,
    "qr_activated_at" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installation_ticket_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installation_services" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "type" "InstallationServiceType" NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "installation_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "employee_code" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "photo" TEXT,
    "region" TEXT,
    "city" TEXT,
    "specialization" TEXT,
    "status" "InstallerStatus" NOT NULL DEFAULT 'AVAILABLE',
    "max_assignments" INTEGER NOT NULL DEFAULT 5,
    "current_load" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_installations" INTEGER NOT NULL DEFAULT 0,
    "gps_lat" DECIMAL(10,7),
    "gps_lng" DECIMAL(10,7),
    "last_gps_update" TIMESTAMP(3),
    "travel_status" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installer_travel_logs" (
    "id" UUID NOT NULL,
    "installer_id" UUID NOT NULL,
    "ticket_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'en_route',
    "gps_lat" DECIMAL(10,7),
    "gps_lng" DECIMAL(10,7),
    "address" TEXT,
    "notes" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "installer_travel_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installer_checklists" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "photo_url" TEXT,
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "installer_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_targets" (
    "id" UUID NOT NULL,
    "sales_profile_id" UUID NOT NULL,
    "period" "TargetPeriod" NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "week" INTEGER,
    "leads_target" INTEGER,
    "conversions_target" INTEGER,
    "revenue_target" DECIMAL(15,2),
    "recurring_revenue_target" DECIMAL(15,2),
    "renewals_target" INTEGER,
    "retention_target" INTEGER,
    "installations_target" INTEGER,
    "training_target" INTEGER,
    "collections_target" DECIMAL(15,2),
    "achieved_leads" INTEGER DEFAULT 0,
    "achieved_conversions" INTEGER DEFAULT 0,
    "achieved_revenue" DECIMAL(15,2) DEFAULT 0,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_snapshots" (
    "id" UUID NOT NULL,
    "period" "KpiPeriod" NOT NULL,
    "date_from" TIMESTAMP(3) NOT NULL,
    "date_to" TIMESTAMP(3) NOT NULL,
    "total_revenue" DECIMAL(15,2),
    "recurring_revenue" DECIMAL(15,2),
    "installation_revenue" DECIMAL(15,2),
    "active_subscriptions" INTEGER,
    "new_subscriptions" INTEGER,
    "expired_subscriptions" INTEGER,
    "total_commission_earned" DECIMAL(15,2),
    "total_commission_paid" DECIMAL(15,2),
    "total_commission_pending" DECIMAL(15,2),
    "total_leads" INTEGER,
    "new_leads" INTEGER,
    "converted_leads" INTEGER,
    "lost_leads" INTEGER,
    "active_customers" INTEGER,
    "churned_customers" INTEGER,
    "retained_customers" INTEGER,
    "installations_completed" INTEGER,
    "installations_pending" INTEGER,
    "renewals_successful" INTEGER,
    "renewals_failed" INTEGER,
    "mrr" DECIMAL(15,2),
    "arr" DECIMAL(15,2),
    "churn_rate" DECIMAL(5,2),
    "retention_rate" DECIMAL(5,2),
    "conversion_rate" DECIMAL(5,2),
    "metadata" JSONB DEFAULT '{}',
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_lifetime_values" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "installation_ticket_id" UUID,
    "lifetime_revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "recurring_revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_commission_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net_profit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "months_active" INTEGER NOT NULL DEFAULT 0,
    "retention_count" INTEGER NOT NULL DEFAULT 0,
    "renewal_count" INTEGER NOT NULL DEFAULT 0,
    "upgrade_count" INTEGER NOT NULL DEFAULT 0,
    "downgrade_count" INTEGER NOT NULL DEFAULT 0,
    "branch_growth" INTEGER NOT NULL DEFAULT 0,
    "catalog_growth" INTEGER NOT NULL DEFAULT 0,
    "user_growth" INTEGER NOT NULL DEFAULT 0,
    "last_activity_date" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_lifetime_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_bonus_configs" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger_type" TEXT NOT NULL,
    "trigger_value" INTEGER,
    "bonus_type" TEXT NOT NULL,
    "bonus_value" DECIMAL(15,2) NOT NULL,
    "formula" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retention_bonus_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_bonus_earned" (
    "id" UUID NOT NULL,
    "config_id" UUID NOT NULL,
    "sales_profile_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retention_bonus_earned_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_methods" (
    "id" UUID NOT NULL,
    "sales_profile_id" UUID NOT NULL,
    "type" "PayoutMethodType" NOT NULL,
    "label" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PackageSubscriptionPlans" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_PackageSubscriptionPlans_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "commission_rules_v2_trigger_event_is_active_idx" ON "commission_rules_v2"("trigger_event", "is_active");

-- CreateIndex
CREATE INDEX "commission_rules_v2_industry_idx" ON "commission_rules_v2"("industry");

-- CreateIndex
CREATE INDEX "recurring_commission_configs_sales_profile_id_idx" ON "recurring_commission_configs"("sales_profile_id");

-- CreateIndex
CREATE INDEX "recurring_commission_configs_subscription_id_idx" ON "recurring_commission_configs"("subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_commission_configs_sales_profile_id_subscription__key" ON "recurring_commission_configs"("sales_profile_id", "subscription_id", "rule_id");

-- CreateIndex
CREATE INDEX "installation_packages_status_idx" ON "installation_packages"("status");

-- CreateIndex
CREATE UNIQUE INDEX "installation_ticket_packages_ticket_id_key" ON "installation_ticket_packages"("ticket_id");

-- CreateIndex
CREATE INDEX "installation_ticket_packages_ticket_id_idx" ON "installation_ticket_packages"("ticket_id");

-- CreateIndex
CREATE INDEX "installation_services_ticket_id_idx" ON "installation_services"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "installers_user_id_key" ON "installers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "installers_employee_code_key" ON "installers"("employee_code");

-- CreateIndex
CREATE INDEX "installers_region_idx" ON "installers"("region");

-- CreateIndex
CREATE INDEX "installers_city_idx" ON "installers"("city");

-- CreateIndex
CREATE INDEX "installers_status_idx" ON "installers"("status");

-- CreateIndex
CREATE INDEX "installers_user_id_idx" ON "installers"("user_id");

-- CreateIndex
CREATE INDEX "installer_travel_logs_installer_id_idx" ON "installer_travel_logs"("installer_id");

-- CreateIndex
CREATE INDEX "installer_travel_logs_ticket_id_idx" ON "installer_travel_logs"("ticket_id");

-- CreateIndex
CREATE INDEX "installer_checklists_ticket_id_idx" ON "installer_checklists"("ticket_id");

-- CreateIndex
CREATE INDEX "sales_targets_sales_profile_id_idx" ON "sales_targets"("sales_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_targets_sales_profile_id_period_year_month_week_key" ON "sales_targets"("sales_profile_id", "period", "year", "month", "week");

-- CreateIndex
CREATE INDEX "kpi_snapshots_period_computed_at_idx" ON "kpi_snapshots"("period", "computed_at");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_snapshots_period_date_from_date_to_key" ON "kpi_snapshots"("period", "date_from", "date_to");

-- CreateIndex
CREATE UNIQUE INDEX "customer_lifetime_values_business_id_key" ON "customer_lifetime_values"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_lifetime_values_installation_ticket_id_key" ON "customer_lifetime_values"("installation_ticket_id");

-- CreateIndex
CREATE INDEX "customer_lifetime_values_business_id_idx" ON "customer_lifetime_values"("business_id");

-- CreateIndex
CREATE INDEX "retention_bonus_earned_sales_profile_id_status_idx" ON "retention_bonus_earned"("sales_profile_id", "status");

-- CreateIndex
CREATE INDEX "payout_methods_sales_profile_id_idx" ON "payout_methods"("sales_profile_id");

-- CreateIndex
CREATE INDEX "_PackageSubscriptionPlans_B_index" ON "_PackageSubscriptionPlans"("B");

-- AddForeignKey
ALTER TABLE "commission_ledger" ADD CONSTRAINT "commission_ledger_payout_method_id_fkey" FOREIGN KEY ("payout_method_id") REFERENCES "payout_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_tickets" ADD CONSTRAINT "installation_tickets_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "installation_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_tickets" ADD CONSTRAINT "installation_tickets_installer_id_fkey" FOREIGN KEY ("installer_id") REFERENCES "installers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rules_v2" ADD CONSTRAINT "commission_rules_v2_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rules_v2" ADD CONSTRAINT "commission_rules_v2_installation_package_id_fkey" FOREIGN KEY ("installation_package_id") REFERENCES "installation_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_commission_configs" ADD CONSTRAINT "recurring_commission_configs_sales_profile_id_fkey" FOREIGN KEY ("sales_profile_id") REFERENCES "sales_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_commission_configs" ADD CONSTRAINT "recurring_commission_configs_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_commission_configs" ADD CONSTRAINT "recurring_commission_configs_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "commission_rules_v2"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_ticket_packages" ADD CONSTRAINT "installation_ticket_packages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "installation_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_ticket_packages" ADD CONSTRAINT "installation_ticket_packages_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "installation_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_services" ADD CONSTRAINT "installation_services_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "installation_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installers" ADD CONSTRAINT "installers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installer_travel_logs" ADD CONSTRAINT "installer_travel_logs_installer_id_fkey" FOREIGN KEY ("installer_id") REFERENCES "installers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installer_checklists" ADD CONSTRAINT "installer_checklists_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "installation_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_sales_profile_id_fkey" FOREIGN KEY ("sales_profile_id") REFERENCES "sales_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_lifetime_values" ADD CONSTRAINT "customer_lifetime_values_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_lifetime_values" ADD CONSTRAINT "customer_lifetime_values_installation_ticket_id_fkey" FOREIGN KEY ("installation_ticket_id") REFERENCES "installation_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retention_bonus_earned" ADD CONSTRAINT "retention_bonus_earned_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "retention_bonus_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_methods" ADD CONSTRAINT "payout_methods_sales_profile_id_fkey" FOREIGN KEY ("sales_profile_id") REFERENCES "sales_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageSubscriptionPlans" ADD CONSTRAINT "_PackageSubscriptionPlans_A_fkey" FOREIGN KEY ("A") REFERENCES "installation_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageSubscriptionPlans" ADD CONSTRAINT "_PackageSubscriptionPlans_B_fkey" FOREIGN KEY ("B") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

