export const SESSION_STATUSES = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
] as const;

export const SESSION_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  closed: "Closed",
};

export const SESSION_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
  open: "success",
  closed: "secondary",
};

export const SESSION_SORT_OPTIONS = [
  { label: "Opened At", value: "openedAt" },
  { label: "Status", value: "status" },
] as const;

export const DEFAULT_PAGE_SIZE = 20;
