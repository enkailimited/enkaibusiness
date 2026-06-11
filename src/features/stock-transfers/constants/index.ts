export const TRANSFER_STATUSES = ["draft", "dispatched", "received", "cancelled"] as const;

export const TRANSFER_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  dispatched: "Dispatched",
  received: "Received",
  cancelled: "Cancelled",
};

export const TRANSFER_STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "destructive"> = {
  draft: "secondary",
  dispatched: "default",
  received: "success",
  cancelled: "destructive",
};
