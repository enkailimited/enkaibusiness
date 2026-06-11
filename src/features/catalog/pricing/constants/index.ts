export const PRICE_LIST_TYPES = ["retail", "wholesale", "promo"] as const;

export const PRICE_LIST_TYPE_LABELS: Record<string, string> = {
  retail: "Retail",
  wholesale: "Wholesale",
  promo: "Promotional",
};

export const PRICE_LIST_TYPE_VARIANTS: Record<string, "default" | "secondary" | "outline" | "success" | "destructive"> = {
  retail: "default",
  wholesale: "secondary",
  promo: "destructive",
};

export const PRICE_LIST_PRIORITIES = [
  { label: "Lowest", value: 0 },
  { label: "Low", value: 1 },
  { label: "Normal", value: 2 },
  { label: "High", value: 3 },
  { label: "Highest", value: 4 },
] as const;
