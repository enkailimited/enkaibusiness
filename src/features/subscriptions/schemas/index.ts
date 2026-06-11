import { z } from "zod";

export const subscriptionIntervalEnum = z.enum([
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
]);

export const createSubscriptionPlanSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200, "Slug is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  description: z.string().optional().or(z.literal("")),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().default("TZS"),
  interval: subscriptionIntervalEnum,
});

export const updateSubscriptionPlanSchema =
  createSubscriptionPlanSchema.partial();

export const createSubscriptionSchema = z.object({
  planId: z.string().uuid("Invalid plan ID"),
  businessId: z.string().uuid("Invalid business ID"),
});

export const recordPaymentSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.string().optional().or(z.literal("")),
  reference: z.string().optional().or(z.literal("")),
});

export type CreateSubscriptionPlanSchema = z.infer<
  typeof createSubscriptionPlanSchema
>;
export type UpdateSubscriptionPlanSchema = z.infer<
  typeof updateSubscriptionPlanSchema
>;
export type CreateSubscriptionSchema = z.infer<
  typeof createSubscriptionSchema
>;
export type RecordPaymentSchema = z.infer<typeof recordPaymentSchema>;
