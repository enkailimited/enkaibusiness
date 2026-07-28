-- AlterEnum: Add MINING to Industry enum
ALTER TYPE "Industry" ADD VALUE IF NOT EXISTS 'MINING';

-- AlterEnum: Add mining-related CatalogItemTypes
ALTER TYPE "CatalogItemType" ADD VALUE IF NOT EXISTS 'MINERAL';
ALTER TYPE "CatalogItemType" ADD VALUE IF NOT EXISTS 'ORE';
ALTER TYPE "CatalogItemType" ADD VALUE IF NOT EXISTS 'EQUIPMENT';
