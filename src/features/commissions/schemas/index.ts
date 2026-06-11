import { z } from "zod";

export const commissionTypeEnum = z.enum(["FLAT", "PERCENTAGE"]);

export const createCommissionRuleSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  hierarchyLevelId: z.string().uuid().optional().or(z.literal("")),
  type: commissionTypeEnum,
  value: z.number().nonnegative("Value must be non-negative"),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().nonnegative().optional(),
});

export const updateCommissionRuleSchema = createCommissionRuleSchema.partial();

export const approveCommissionSchema = z.object({
  ledgerId: z.string().uuid("Invalid ledger ID"),
});

export const createPayoutSchema = z.object({
  entries: z.array(z.string().uuid("Invalid ledger ID")).min(1, "At least one entry is required"),
  amount: z.number().positive("Amount must be positive"),
  notes: z.string().optional().or(z.literal("")),
});

export const commissionFilterSchema = z.object({
  salesProfileId: z.string().uuid().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type CreateCommissionRuleSchema = z.infer<typeof createCommissionRuleSchema>;
export type UpdateCommissionRuleSchema = z.infer<typeof updateCommissionRuleSchema>;
export type ApproveCommissionSchema = z.infer<typeof approveCommissionSchema>;
export type CreatePayoutSchema = z.infer<typeof createPayoutSchema>;
export type CommissionFilterSchema = z.infer<typeof commissionFilterSchema>;
