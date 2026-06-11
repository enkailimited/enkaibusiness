export const PAYMENT_METHOD_TYPES = ["cash", "card", "mobile", "bank", "credit"] as const;

export const PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"] as const;

export const PAYMENT_REFERENCE_TYPES = [
  { value: "sale", label: "Sale" },
  { value: "invoice", label: "Invoice" },
  { value: "credit", label: "Credit" },
  { value: "subscription", label: "Subscription" },
  { value: "purchase", label: "Purchase" },
  { value: "expense", label: "Expense" },
] as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  mobile: "Mobile Money",
  bank: "Bank Transfer",
  credit: "Credit",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
  refunded: "Refunded",
};
