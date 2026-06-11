export const INVOICE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  partial: "Partial",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const INVOICE_NUMBER_PREFIX = "INV";

export const INVOICE_SORT_OPTIONS = [
  { value: "invoiceDate", label: "Invoice Date" },
  { value: "dueDate", label: "Due Date" },
  { value: "total", label: "Total" },
  { value: "createdAt", label: "Date Created" },
] as const;

export const DEFAULT_PAGE_SIZE = 20;
