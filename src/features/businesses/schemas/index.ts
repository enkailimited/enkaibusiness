import { z } from "zod";

export const industryEnum = z.enum([
  "COMMERCE",
  "HEALTHCARE",
  "RESTAURANT",
  "MANUFACTURING",
  "AGRICULTURE",
  "SERVICES",
]);

export const createBusinessSchema = z.object({
  name: z
    .string()
    .min(1, "Business name is required")
    .max(200, "Business name is too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  currency: z.string().default("TZS"),
  timezone: z.string().default("Africa/Dar_es_Salaam"),
  taxId: z.string().optional().or(z.literal("")),
  industry: industryEnum,
  modes: z.array(z.string()).min(1, "At least one mode is required"),
  businessTypeId: z.string().uuid().optional().or(z.literal("")),
});

export const updateBusinessSchema = createBusinessSchema.partial();

export const businessModeSchema = z.object({
  industry: industryEnum,
  mode: z.string().min(1, "Mode is required"),
});

export const registerBusinessSchema = createBusinessSchema.extend({
  businessSize: z.string().default("small"),
  planId: z.string().min(1, "Subscription plan is required"),
  qrOrderingEnabled: z.boolean().default(false),
  workspaceId: z.string().optional(),
  leadId: z.string().optional(),
}).refine(data => data.workspaceId || data.leadId, {
  message: "Either workspaceId or leadId is required",
});

export type CreateBusinessSchema = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessSchema = z.infer<typeof updateBusinessSchema>;
export type BusinessModeSchema = z.infer<typeof businessModeSchema>;
export type RegisterBusinessInput = z.infer<typeof registerBusinessSchema>;
