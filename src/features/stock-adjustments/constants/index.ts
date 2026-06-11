export const ADJUSTMENT_STATUSES = ["draft", "approved"] as const;

export const ADJUSTMENT_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  approved: "Approved",
};

export const COMMON_ADJUSTMENT_REASONS = [
  "Damaged goods",
  "Expired stock",
  "Write-off",
  "Found stock",
  "Counting correction",
  "Theft loss",
  "Supplier error",
  "Other",
] as const;

export const ADJUSTMENT_REASON_LABELS: Record<string, string> = {
  "Damaged goods": "Damaged Goods",
  "Expired stock": "Expired Stock",
  "Write-off": "Write-off",
  "Found stock": "Found Stock",
  "Counting correction": "Counting Correction",
  "Theft loss": "Theft Loss",
  "Supplier error": "Supplier Error",
  Other: "Other",
};
