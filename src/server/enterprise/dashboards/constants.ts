import type { KpiPeriod, TargetPeriod } from "@prisma/client";

export const DASHBOARD_COLORS = {
  primary: "#2563eb",
  secondary: "#10b981",
  accent: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  warning: "#f97316",
  success: "#22c55e",
  purple: "#8b5cf6",
  pink: "#ec4899",
  gray: "#6b7280",
} as const;

export const CHART_COLORS = [
  DASHBOARD_COLORS.primary,
  DASHBOARD_COLORS.secondary,
  DASHBOARD_COLORS.accent,
  DASHBOARD_COLORS.purple,
  DASHBOARD_COLORS.pink,
  DASHBOARD_COLORS.info,
  DASHBOARD_COLORS.danger,
  DASHBOARD_COLORS.warning,
];

export const METRIC_LABELS: Record<string, string> = {
  mrr: "Monthly Recurring Revenue",
  arr: "Annual Recurring Revenue",
  totalRevenue: "Total Revenue",
  activeSubscriptions: "Active Subscriptions",
  commissionEarned: "Commission Earned",
  commissionPaid: "Commission Paid",
  newBusinesses: "New Businesses",
  activeInstallers: "Active Installers",
  pendingInstallations: "Pending Installations",
  totalLeads: "Total Leads",
  convertedLeads: "Converted Leads",
  averageCLV: "Average Customer Lifetime Value",
  churnRate: "Churn Rate",
  retentionRate: "Retention Rate",
};

export const DEFAULT_RANGES = {
  revenueMonths: 6,
  commissionMonths: 6,
  subscriptionMonths: 6,
  topCLVLimit: 10,
  recentEntries: 10,
} as const;

export const REPORT_PERIODS: KpiPeriod[] = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"];

export const TARGET_PERIODS: TargetPeriod[] = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"];
