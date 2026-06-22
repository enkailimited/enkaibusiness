-- Phase 1: Commerce Architecture Migration
-- Adds CustomerType + PricingTier enums, pricingTier on Sale/SaleItem,
-- customerType restriction on PriceList, mode on QRCode

-- Create new enums
CREATE TYPE "CustomerType" AS ENUM ('RETAIL', 'WHOLESALE', 'WALK_IN');
CREATE TYPE "PricingTier" AS ENUM ('RETAIL', 'WHOLESALE', 'PROMO', 'CUSTOMER_GROUP');

-- Migrate Customer.customer_type from String to CustomerType enum
-- First add a temporary column, copy data with uppercase conversion, then swap
ALTER TABLE "customers" ADD COLUMN "customer_type_new" "CustomerType";
UPDATE "customers" SET "customer_type_new" = CASE
  WHEN "customer_type" = 'retail' THEN 'RETAIL'::"CustomerType"
  WHEN "customer_type" = 'wholesale' THEN 'WHOLESALE'::"CustomerType"
  WHEN "customer_type" = 'walk_in' THEN 'WALK_IN'::"CustomerType"
  ELSE 'RETAIL'::"CustomerType"
END;
ALTER TABLE "customers" DROP COLUMN "customer_type";
ALTER TABLE "customers" RENAME COLUMN "customer_type_new" TO "customer_type";
ALTER TABLE "customers" ALTER COLUMN "customer_type" SET NOT NULL;
ALTER TABLE "customers" ALTER COLUMN "customer_type" SET DEFAULT 'RETAIL';

-- Add pricingTier to sales table
ALTER TABLE "sales" ADD COLUMN "pricing_tier" "PricingTier";

-- Add pricingTier to sale_items table
ALTER TABLE "sale_items" ADD COLUMN "pricing_tier" "PricingTier";

-- Add customerType to price_lists table (optional restriction)
ALTER TABLE "price_lists" ADD COLUMN "customer_type" "CustomerType";

-- Add mode to qr_codes table (retail, wholesale, restaurant, general)
ALTER TABLE "qr_codes" ADD COLUMN "mode" TEXT;
