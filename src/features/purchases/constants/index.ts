export const PURCHASE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const PURCHASE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PURCHASE_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
  draft: "secondary",
  completed: "success",
  cancelled: "destructive",
};

export const PURCHASE_SORT_OPTIONS = [
  { label: "Date", value: "purchaseDate" },
  { label: "Total", value: "total" },
  { label: "Reference", value: "reference" },
] as const;

export const DEFAULT_PAGE_SIZE = 20;
