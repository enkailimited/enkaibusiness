export const PRODUCT_VIEWS = ["grid", "list"] as const;

export const PRODUCT_SORT_OPTIONS = [
  { label: "Name", value: "name" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Date Added", value: "createdAt" },
  { label: "Recently Updated", value: "updatedAt" },
] as const;

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  true: "Active",
  false: "Inactive",
};

export const PRODUCT_DEFAULT_ITEM_TYPE = "PRODUCT" as const;
