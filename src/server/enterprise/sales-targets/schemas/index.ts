import { z } from "zod";

export const targetPeriodEnum = z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]);
export const kpiPeriodEnum = z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]);

export const getTargetSchema = z.object({
  salesProfileId: z.string().uuid(),
  period: targetPeriodEnum,
  year: z.number().int(),
  month: z.number().int().min(1).max(12).optional(),
  week: z.number().int().min(1).max(53).optional(),
});

export const setTargetSchema = z.object({
  salesProfileId: z.string().uuid(),
  period: targetPeriodEnum,
  year: z.number().int(),
  month: z.number().int().min(1).max(12).optional().nullable(),
  week: z.number().int().min(1).max(53).optional().nullable(),
  leadsTarget: z.number().int().min(0).optional().nullable(),
  conversionsTarget: z.number().int().min(0).optional().nullable(),
  revenueTarget: z.number().min(0).optional().nullable(),
  recurringRevenueTarget: z.number().min(0).optional().nullable(),
  renewalsTarget: z.number().int().min(0).optional().nullable(),
  retentionTarget: z.number().int().min(0).optional().nullable(),
  installationsTarget: z.number().int().min(0).optional().nullable(),
  trainingTarget: z.number().int().min(0).optional().nullable(),
  collectionsTarget: z.number().min(0).optional().nullable(),
});

export const computeKpiSnapshotSchema = z.object({
  period: kpiPeriodEnum,
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const updateAchievedSchema = z.object({
  salesProfileId: z.string().uuid(),
  metric: z.enum([
    "leads", "conversions", "revenue", "recurringRevenue",
    "renewals", "retention", "installations", "training", "collections",
  ]),
  value: z.number().min(0),
});
