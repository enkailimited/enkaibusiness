export const SUBSCRIPTION_INTERVALS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
] as const;

export const SUBSCRIPTION_INTERVAL_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export const SUBSCRIPTION_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "GRACE_PERIOD", label: "Grace Period" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  GRACE_PERIOD: "Grace Period",
  SUSPENDED: "Suspended",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

export const SUBSCRIPTION_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
> = {
  ACTIVE: "success",
  GRACE_PERIOD: "warning",
  SUSPENDED: "destructive",
  EXPIRED: "destructive",
  CANCELLED: "secondary",
};

export const WALLET_TRANSACTION_TYPES = [
  { value: "deposit", label: "Deposit" },
  { value: "consumption", label: "Consumption" },
  { value: "bonus", label: "Bonus" },
  { value: "adjustment", label: "Adjustment" },
  { value: "refund", label: "Refund" },
  { value: "expiry", label: "Expiry" },
] as const;

export const WALLET_TRANSACTION_TYPE_LABELS: Record<string, string> = {
  deposit: "Deposit",
  consumption: "Consumption",
  bonus: "Bonus",
  adjustment: "Adjustment",
  refund: "Refund",
  expiry: "Expiry",
};
