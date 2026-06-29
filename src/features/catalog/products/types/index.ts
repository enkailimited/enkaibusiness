import type { CatalogItem, CatalogItemVariant, CatalogItemImage, CatalogItemAssignment, PriceListItem } from "@/types/models";

export interface ProductWithVariants extends CatalogItem {
  variants: CatalogItemVariant[];
  images: CatalogItemImage[];
}

export interface ProductWithRelations extends CatalogItem {
  variants: (CatalogItemVariant & { images: CatalogItemImage[] })[];
  images: CatalogItemImage[];
  assignments: (CatalogItemAssignment & { branch?: { id: string; name: string } | null; store?: { id: string; name: string } | null })[];
  priceListItems: (PriceListItem & { priceList?: { id: string; name: string; type: string } | null })[];
}

export interface ProductFilter {
  itemType: "PRODUCT";
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface VariantInput {
  name: string;
  sku?: string;
  barcode?: string;
  price?: number;
  costPrice?: number;
  imageUrl?: string;
  attributes?: Record<string, unknown>;
  sortOrder?: number;
}
