export const REFERENCE_TYPES = [
  "sale",
  "purchase",
  "adjustment",
  "transfer",
  "return",
  "initial",
] as const;

export const REFERENCE_TYPE_LABELS: Record<string, string> = {
  sale: "Sale",
  purchase: "Purchase",
  adjustment: "Adjustment",
  transfer: "Transfer",
  return: "Return",
  initial: "Initial Stock",
};

export const MOVEMENT_DESCRIPTIONS: Record<string, string> = {
  sale: "Stock deducted from sale",
  purchase: "Stock added from purchase",
  adjustment: "Manual stock adjustment",
  transfer: "Stock transferred between locations",
  return: "Stock returned",
  initial: "Initial stock entry",
};
