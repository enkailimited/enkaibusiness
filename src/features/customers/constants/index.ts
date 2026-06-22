export const CUSTOMER_TYPES = [
  { value: "RETAIL", label: "Retail" },
  { value: "WHOLESALE", label: "Wholesale" },
  { value: "WALK_IN", label: "Walk-in" },
] as const;

export const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  RETAIL: "Retail",
  WHOLESALE: "Wholesale",
  WALK_IN: "Walk-in",
};

export const CUSTOMER_SORT_OPTIONS = [
  { value: "firstName", label: "Name" },
  { value: "createdAt", label: "Date Created" },
  { value: "creditLimit", label: "Credit Limit" },
] as const;

export const DEFAULT_PAGE_SIZE = 20;
