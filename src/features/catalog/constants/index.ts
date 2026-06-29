export const CATALOG_ITEM_TYPES = ["PRODUCT", "SERVICE", "MEDICINE", "MENU_ITEM"] as const;

export const DEFAULT_CURRENCY = "TZS";

export const CATALOG_SORT_OPTIONS = [
  { label: "Name", value: "name" },
  { label: "Price", value: "price" },
  { label: "Date Added", value: "createdAt" },
  { label: "SKU", value: "sku" },
] as const;

export const ITEM_TYPE_LABELS: Record<string, string> = {
  PRODUCT: "Product",
  SERVICE: "Service",
  MEDICINE: "Medicine",
  MENU_ITEM: "Menu Item",
};

export const ITEM_TYPE_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PRODUCT: "default",
  SERVICE: "secondary",
  MEDICINE: "destructive",
  MENU_ITEM: "outline",
};

export const DEFAULT_PAGE_SIZE = 20;

// Catalog type slugs for Commerce business type
export const COMMERCE_CATALOG_TYPES = {
  PRODUCT: "product",
  SERVICE: "service",
} as const;

export type CommerceCatalogType = (typeof COMMERCE_CATALOG_TYPES)[keyof typeof COMMERCE_CATALOG_TYPES];

export const CATALOG_TYPE_LABELS: Record<string, string> = {
  product: "Product",
  service: "Service",
};
