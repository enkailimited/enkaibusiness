export const NOTIFICATION_TYPES = [
  { value: "alert", label: "Alert" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "success", label: "Success" },
] as const;

export const TYPE_LABELS: Record<string, string> = {
  alert: "Alert",
  info: "Info",
  warning: "Warning",
  success: "Success",
};

export const TYPE_VARIANTS: Record<string, "default" | "destructive" | "secondary" | "outline" | "success" | "warning"> = {
  alert: "destructive",
  info: "default",
  warning: "warning",
  success: "success",
};

export const DEFAULT_PAGE_SIZE = 20;
