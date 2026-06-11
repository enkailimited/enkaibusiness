export const SUPPLIER_TYPES = [
  { value: "local", label: "Local" },
  { value: "international", label: "International" },
] as const;

export const SUPPLIER_TYPE_LABELS: Record<string, string> = {
  local: "Local",
  international: "International",
};

export const PAYMENT_TERMS = [
  { value: "immediate", label: "Immediate" },
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
  { value: "due_on_receipt", label: "Due on Receipt" },
] as const;

export const PAYMENT_TERMS_LABELS: Record<string, string> = {
  immediate: "Immediate",
  net_15: "Net 15",
  net_30: "Net 30",
  net_45: "Net 45",
  net_60: "Net 60",
  due_on_receipt: "Due on Receipt",
};

export const COUNTRIES = [
  "Tanzania",
  "Kenya",
  "Uganda",
  "Rwanda",
  "Burundi",
  "South Sudan",
  "Ethiopia",
  "Somalia",
  "DRC",
  "South Africa",
  "Nigeria",
  "Ghana",
  "China",
  "India",
  "UAE",
  "United Kingdom",
  "United States",
] as const;

export const CURRENCIES = [
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
] as const;

export const DEFAULT_PAGE_SIZE = 20;
