import type { ReportPeriod } from "../types";

export const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom Range" },
];

export const DATE_PRESETS: { label: string; days: number }[] = [
  { label: "Today", days: 0 },
  { label: "Yesterday", days: 1 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "This Month", days: 0 },
  { label: "Last Month", days: 0 },
  { label: "This Quarter", days: 0 },
  { label: "Last Quarter", days: 0 },
  { label: "This Year", days: 0 },
  { label: "Last Year", days: 0 },
];

export const DEFAULT_PERIOD: ReportPeriod = "monthly";
