export const PURCHASE_ORDER_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "approved", label: "Approved" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const PURCHASE_ORDER_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  approved: "Approved",
  received: "Received",
  cancelled: "Cancelled",
};

export const PURCHASE_ORDER_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
  draft: "secondary",
  sent: "default",
  approved: "success",
  received: "outline",
  cancelled: "destructive",
};

export const PURCHASE_ORDER_SORT_OPTIONS = [
  { label: "Order Date", value: "orderDate" },
  { label: "Expected Date", value: "expectedDate" },
  { label: "Total", value: "total" },
] as const;

export const DEFAULT_PAGE_SIZE = 20;
