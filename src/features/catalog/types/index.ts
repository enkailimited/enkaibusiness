import type { CatalogItem } from "@/types/models";

export interface CatalogItemWithRelations extends CatalogItem {
  category?: { id: string; name: string; slug: string } | null;
  brand?: { id: string; name: string; slug: string } | null;
  unit?: { id: string; name: string; abbreviation: string } | null;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
  updatedBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateCatalogItemInput {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  itemType: "PRODUCT" | "SERVICE" | "MEDICINE" | "MENU_ITEM";
  catalogTypeId?: string;
  categoryId?: string;
  brandId?: string;
  unitId?: string;
  isService?: boolean;
  trackStock?: boolean;
  imageUrl?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateCatalogItemInput {
  name?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  itemType?: "PRODUCT" | "SERVICE" | "MEDICINE" | "MENU_ITEM";
  catalogTypeId?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  unitId?: string | null;
  isService?: boolean;
  trackStock?: boolean;
  imageUrl?: string | null;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CatalogItemFilter {
  itemType?: string;
  categoryId?: string;
  brandId?: string;
  unitId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CatalogListParams {
  businessId: string;
  filter?: CatalogItemFilter;
}
