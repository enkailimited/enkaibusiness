export const DEFAULT_GROUPS = [
  { name: "General", description: "General customer group", discountPercent: 0, isDefault: true },
  { name: "VIP", description: "VIP customers", discountPercent: 10, isDefault: false },
  { name: "Wholesale", description: "Wholesale customers", discountPercent: 15, isDefault: false },
] as const;
