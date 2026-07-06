import { z } from "zod";

export const periodSchema = z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] as const);

export const dateRangeSchema = z.object({
  period: periodSchema.default("MONTHLY"),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const platformDashboardSchema = z.object({});

export const salesDashboardSchema = z.object({
  salesProfileId: z.string().uuid(),
});

export const installerDashboardSchema = z.object({
  installerId: z.string().uuid(),
});

export const revenueReportSchema = dateRangeSchema;

export const commissionReportSchema = dateRangeSchema.extend({
  salesProfileId: z.string().uuid().optional(),
});

export const installationReportSchema = dateRangeSchema.extend({
  installerId: z.string().uuid().optional(),
});

export const clvReportSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
});

export const churnReportSchema = dateRangeSchema;

export const retentionReportSchema = dateRangeSchema;

export const referralReportSchema = dateRangeSchema.extend({
  limit: z.number().int().min(1).max(50).default(10),
});

export const salesPerformanceReportSchema = dateRangeSchema.extend({
  limit: z.number().int().min(1).max(100).default(20),
});
