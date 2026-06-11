export const SALE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
] as const;

export const SALE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const SALE_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  draft: "secondary",
  completed: "success",
  cancelled: "destructive",
  refunded: "warning",
};

export const SALE_SORT_OPTIONS = [
  { label: "Sale Date", value: "saleDate" },
  { label: "Grand Total", value: "grandTotal" },
  { label: "Created At", value: "createdAt" },
] as const;

export const DEFAULT_PAGE_SIZE = 20;

export const SALE_REFERENCE_PREFIX = "SALE";
