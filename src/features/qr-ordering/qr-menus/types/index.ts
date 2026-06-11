import type { QRMenuItem, CatalogItem } from "@/types/models";

export interface MenuItemWithCatalog extends QRMenuItem {
  catalogItem: Pick<CatalogItem, "id" | "name" | "imageUrl" | "type">;
}

export interface CreateMenuItemInput {
  businessId: string;
  qrCodeId: string;
  catalogItemId: string;
  isAvailable?: boolean;
  sortOrder?: number;
  price?: number;
}

export interface UpdateMenuItemInput {
  isAvailable?: boolean;
  sortOrder?: number;
  price?: number | null;
}
