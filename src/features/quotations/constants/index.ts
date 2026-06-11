export const QUOTATION_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "converted", label: "Converted" },
] as const;

export const QUOTATION_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  converted: "Converted",
};

export const QUOTATION_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  draft: "secondary",
  sent: "default",
  accepted: "success",
  rejected: "destructive",
  expired: "warning",
  converted: "outline",
};

export const QUOTATION_SORT_OPTIONS = [
  { label: "Quote Date", value: "quoteDate" },
  { label: "Total", value: "total" },
  { label: "Expiry Date", value: "expiryDate" },
] as const;

export const DEFAULT_PAGE_SIZE = 20;
