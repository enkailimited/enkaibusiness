export const ACCOUNT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "frozen", label: "Frozen" },
  { value: "closed", label: "Closed" },
] as const;

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  frozen: "Frozen",
  closed: "Closed",
};

export const TRANSACTION_TYPES = [
  { value: "credit_sale", label: "Credit Sale" },
  { value: "payment", label: "Payment" },
  { value: "adjustment", label: "Adjustment" },
  { value: "write_off", label: "Write Off" },
  { value: "refund", label: "Refund" },
] as const;

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  credit_sale: "Credit Sale",
  payment: "Payment",
  adjustment: "Adjustment",
  write_off: "Write Off",
  refund: "Refund",
};

export const DEFAULT_PAGE_SIZE = 20;
