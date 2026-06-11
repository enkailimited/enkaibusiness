export const RETURN_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

export const RETURN_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  approved: "Approved",
  rejected: "Rejected",
};

export const RETURN_CONDITIONS = [
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "defective", label: "Defective" },
  { value: "change_of_mind", label: "Change of Mind" },
] as const;

export const RETURN_CONDITION_LABELS: Record<string, string> = {
  damaged: "Damaged",
  expired: "Expired",
  defective: "Defective",
  change_of_mind: "Change of Mind",
};

export const REFUND_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "mobile", label: "Mobile Money" },
  { value: "credit", label: "Store Credit" },
] as const;

export const DEFAULT_PAGE_SIZE = 20;
