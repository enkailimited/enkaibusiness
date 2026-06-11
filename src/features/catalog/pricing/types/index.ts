import type { PriceList, PriceListItem, CatalogItem } from "@/types/models";

export interface PriceListWithItems extends PriceList {
  items: (PriceListItem & { catalogItem: Pick<CatalogItem, "id" | "name" | "sku" | "imageUrl"> | null })[];
}

export interface PriceListInput {
  businessId: string;
  name: string;
  type: "retail" | "wholesale" | "promo";
  priority?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  items?: PriceListItemInput[];
}

export interface PriceListItemInput {
  catalogItemId: string;
  variantId?: string;
  unitPrice: number;
  minQuantity?: number;
}

export type PriceListType = "retail" | "wholesale" | "promo";
