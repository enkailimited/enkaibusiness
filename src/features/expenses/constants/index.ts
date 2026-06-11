export const EXPENSE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
] as const;

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  approved: "Approved",
  paid: "Paid",
};

export const EXPENSE_SORT_OPTIONS = [
  { value: "expenseDate", label: "Date" },
  { value: "amount", label: "Amount" },
  { value: "createdAt", label: "Date Created" },
] as const;

export const DEFAULT_PAGE_SIZE = 20;
