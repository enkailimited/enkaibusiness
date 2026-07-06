export const PERIOD_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

export const DEFAULT_LEADS_TARGET = 10;
export const DEFAULT_CONVERSIONS_TARGET = 3;
export const DEFAULT_REVENUE_TARGET = 500000;
export const DEFAULT_RECURRING_REVENUE_TARGET = 200000;
export const DEFAULT_RENEWALS_TARGET = 5;
export const DEFAULT_RETENTION_TARGET = 80;
export const DEFAULT_INSTALLATIONS_TARGET = 2;
export const DEFAULT_TRAINING_TARGET = 2;
export const DEFAULT_COLLECTIONS_TARGET = 300000;

export const TARGET_METRICS = [
  "leads",
  "conversions",
  "revenue",
  "recurringRevenue",
  "renewals",
  "retention",
  "installations",
  "training",
  "collections",
] as const;

export const KPI_PERIOD_ORDER: Record<string, number> = {
  DAILY: 1,
  WEEKLY: 2,
  MONTHLY: 3,
  QUARTERLY: 4,
  YEARLY: 5,
};

export const SNAPSHOT_LIMIT_DEFAULT = 12;
