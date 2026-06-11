export const LOCATION_TYPES = ["business", "branch", "store"] as const;

export const DEFAULT_LOCATION_NAMES = {
  business: "Main Inventory",
  branch: "Branch Inventory",
  store: "Store Inventory",
} as const;

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  business: "Business",
  branch: "Branch",
  store: "Store",
};
