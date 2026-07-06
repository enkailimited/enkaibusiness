import { z } from "zod";

export const commissionTypeEnum = z.enum(["FLAT", "PERCENTAGE"]);

export const calculationTypeEnum = z.enum(["FLAT", "PERCENTAGE", "FORMULA", "TIERED", "HYBRID"]);

export const ruleTypeEnum = z.enum(["COMMISSION", "BONUS", "INCENTIVE", "DISCOUNT", "PROMOTION"]);

export const triggerEventEnum = z.enum([
  "BUSINESS_REGISTRATION",
  "SUBSCRIPTION_ACTIVATION",
  "FIRST_PAYMENT",
  "SUBSCRIPTION_RENEWAL",
  "ANNUAL_RENEWAL",
  "INSTALLATION",
  "TRAINING",
  "VERIFICATION",
  "REFERRAL",
  "UPSELL",
  "CROSS_SELL",
  "ADDON_PURCHASE",
  "CUSTOMER_RETENTION",
  "CUSTOMER_SUCCESS",
  "BUSINESS_EXPANSION",
  "BRANCH_EXPANSION",
  "QR_ACTIVATION",
  "CAMPAIGN_BONUS",
  "SEASONAL_BONUS",
  "REFERRAL_CHAIN",
  "HIERARCHY_OVERRIDE",
]);

export const industryEnum = z.enum([
  "COMMERCE",
  "HEALTHCARE",
  "RESTAURANT",
  "MANUFACTURING",
  "AGRICULTURE",
  "SERVICES",
  "EDUCATION",
  "LOGISTICS",
  "REAL_ESTATE",
  "NON_PROFIT",
]);

export const tierConfigSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  percentage: z.number().nonnegative().optional(),
  flatAmount: z.number().nonnegative().optional(),
});

export const hybridSubRuleSchema = z.object({
  name: z.string().min(1),
  calculationType: z.enum(["FLAT", "PERCENTAGE", "FORMULA"]),
  value: z.number().optional(),
  formula: z.string().optional(),
});

export const hybridConfigSchema = z.object({
  operator: z.enum(["SUM", "MAX", "AVERAGE"]),
  rules: z.array(hybridSubRuleSchema).min(1),
});

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

export const createRuleV2Schema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  description: z.string().optional().or(z.literal("")),
  triggerEvent: triggerEventEnum,
  ruleType: ruleTypeEnum,
  calculationType: calculationTypeEnum.optional(),
  industry: industryEnum.optional().or(z.literal("")).or(z.null()),
  businessModeId: z.string().uuid().optional().or(z.literal("")).or(z.null()),
  subscriptionPlanId: z.string().uuid().optional().or(z.literal("")).or(z.null()),
  installationPackageId: z.string().uuid().optional().or(z.literal("")).or(z.null()),
  minRevenue: z.number().nonnegative().optional().or(z.null()),
  maxRevenue: z.number().nonnegative().optional().or(z.null()),
  minBranches: z.number().int().nonnegative().optional().or(z.null()),
  maxBranches: z.number().int().nonnegative().optional().or(z.null()),
  minCustomers: z.number().int().nonnegative().optional().or(z.null()),
  maxCustomers: z.number().int().nonnegative().optional().or(z.null()),
  minCatalogItems: z.number().int().nonnegative().optional().or(z.null()),
  maxCatalogItems: z.number().int().nonnegative().optional().or(z.null()),
  tiers: z.array(tierConfigSchema).optional(),
  formula: z.string().optional().or(z.literal("")).or(z.null()),
  hybridConfig: hybridConfigSchema.optional().or(z.null()),
  priority: z.number().int().nonnegative().optional(),
  effectiveDate: z.string().optional().or(z.literal("")).or(z.null()),
  expiryDate: z.string().optional().or(z.literal("")).or(z.null()),
  percentage: z.number().nonnegative().optional().or(z.null()),
  flatAmount: z.number().nonnegative().optional().or(z.null()),
});

export const updateRuleV2Schema = createRuleV2Schema.partial().extend({
  isActive: z.boolean().optional(),
});

export const commissionFilterSchema = z.object({
  salesProfileId: z.string().uuid().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const createDistributionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().or(z.literal("")),
  participantType: z.string().min(1, "Participant type is required"),
  percentage: z.number().min(0).max(100),
  fixedAmount: z.number().nonnegative().optional().or(z.null()),
  priority: z.number().int().nonnegative().optional(),
});

export const updateDistributionSchema = createDistributionSchema.partial();

export const createRecurringConfigSchema = z.object({
  salesProfileId: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  ruleId: z.string().uuid(),
  percentage: z.number().min(0).max(100),
});

export const createEntrySchema = z.object({
  salesProfileId: z.string().uuid(),
  amount: z.number(),
  type: commissionTypeEnum,
  description: z.string().optional().or(z.literal("")),
  subscriptionId: z.string().uuid().optional().or(z.literal("")).or(z.null()),
  payoutMethodId: z.string().uuid().optional().or(z.literal("")).or(z.null()),
  paymentReference: z.string().optional().or(z.literal("")).or(z.null()),
  adjustedById: z.string().uuid().optional().or(z.literal("")).or(z.null()),
  adjustmentReason: z.string().optional().or(z.literal("")).or(z.null()),
});

export const adjustmentSchema = z.object({
  amount: z.number(),
  reason: z.string().min(1),
  adjustedById: z.string().uuid(),
});

export const createRetentionBonusConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().or(z.literal("")),
  triggerType: z.string().min(1),
  triggerValue: z.number().int().nonnegative().optional().or(z.null()),
  bonusType: z.string().min(1),
  bonusValue: z.number().nonnegative(),
  formula: z.string().optional().or(z.literal("")).or(z.null()),
});

export const updateRetentionBonusConfigSchema = createRetentionBonusConfigSchema.partial();

export type CreateCommissionRuleSchema = z.infer<typeof createCommissionRuleSchema>;
export type UpdateCommissionRuleSchema = z.infer<typeof updateCommissionRuleSchema>;
export type ApproveCommissionSchema = z.infer<typeof approveCommissionSchema>;
export type CreatePayoutSchema = z.infer<typeof createPayoutSchema>;
export type CommissionFilterSchema = z.infer<typeof commissionFilterSchema>;
export type CreateRuleV2Schema = z.infer<typeof createRuleV2Schema>;
export type UpdateRuleV2Schema = z.infer<typeof updateRuleV2Schema>;
export type CreateDistributionSchema = z.infer<typeof createDistributionSchema>;
export type UpdateDistributionSchema = z.infer<typeof updateDistributionSchema>;
export type CreateRecurringConfigSchema = z.infer<typeof createRecurringConfigSchema>;
export type CreateEntrySchema = z.infer<typeof createEntrySchema>;
export type AdjustmentSchema = z.infer<typeof adjustmentSchema>;
export type CreateRetentionBonusConfigSchema = z.infer<typeof createRetentionBonusConfigSchema>;
export type UpdateRetentionBonusConfigSchema = z.infer<typeof updateRetentionBonusConfigSchema>;
