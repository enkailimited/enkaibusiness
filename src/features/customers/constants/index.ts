export const CUSTOMER_TYPES = [
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
  { value: "walk_in", label: "Walk-in" },
] as const;

export const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  retail: "Retail",
  wholesale: "Wholesale",
  walk_in: "Walk-in",
};

export const CUSTOMER_SORT_OPTIONS = [
  { value: "firstName", label: "Name" },
  { value: "createdAt", label: "Date Created" },
  { value: "creditLimit", label: "Credit Limit" },
] as const;

export const DEFAULT_PAGE_SIZE = 20;
