import { z } from "zod";

export const payoutMethodTypeEnum = z.enum(["BANK", "MOBILE_MONEY", "WALLET", "CASH"]);

export const createPayoutMethodSchema = z.object({
  salesProfileId: z.string().uuid(),
  type: payoutMethodTypeEnum,
  label: z.string().max(100).optional().or(z.literal("")),
  details: z.record(z.string(), z.unknown()).default({}),
});

export const updatePayoutMethodSchema = z.object({
  details: z.record(z.string(), z.unknown()),
});

export const setDefaultMethodSchema = z.object({
  salesProfileId: z.string().uuid(),
  methodId: z.string().uuid(),
});

export const createBatchPayoutSchema = z.object({
  entries: z.array(z.object({
    id: z.string().uuid(),
    salesProfileId: z.string().uuid(),
  })).min(1, "At least one entry is required"),
  methodId: z.string().uuid().optional(),
  notes: z.string().optional().or(z.literal("")),
});

export const processBulkPayoutSchema = z.object({
  payoutId: z.string().uuid(),
  transactionRef: z.string().min(1, "Transaction reference is required"),
});

export const getPayoutHistorySchema = z.object({
  salesProfileId: z.string().uuid(),
});

export const getPayoutHistoryByMethodSchema = z.object({
  methodType: payoutMethodTypeEnum,
});

export type CreatePayoutMethodSchema = z.infer<typeof createPayoutMethodSchema>;
export type UpdatePayoutMethodSchema = z.infer<typeof updatePayoutMethodSchema>;
export type SetDefaultMethodSchema = z.infer<typeof setDefaultMethodSchema>;
export type CreateBatchPayoutSchema = z.infer<typeof createBatchPayoutSchema>;
export type ProcessBulkPayoutSchema = z.infer<typeof processBulkPayoutSchema>;
export type GetPayoutHistorySchema = z.infer<typeof getPayoutHistorySchema>;
export type GetPayoutHistoryByMethodSchema = z.infer<typeof getPayoutHistoryByMethodSchema>;
