import { z } from "zod";

export const leadStatusEnum = z.enum([
  "NEW", "CONTACTED", "INTERESTED", "DEMO", "NEGOTIATION", "CONVERTED", "LOST",
]);

export const leadSourceEnum = z.enum([
  "MANUAL", "SELF_REGISTRATION", "SALES_REGISTRATION", "REFERRAL", "CAMPAIGN",
]);

export const createLeadSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  businessName: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const updateLeadSchema = createLeadSchema.partial();

export const updateLeadStatusSchema = z.object({
  status: leadStatusEnum,
});

export const createLeadActivitySchema = z.object({
  leadId: z.string().uuid("Invalid lead ID"),
  action: z.string().min(1, "Action is required").max(200, "Action is too long"),
  detail: z.string().optional().or(z.literal("")),
});

export const assignLeadSchema = z.object({
  leadId: z.string().uuid("Invalid lead ID"),
  assignedToId: z.string().uuid("Invalid assignee ID"),
  reason: z.string().optional().or(z.literal("")),
});

export const leadFilterSchema = z.object({
  status: z.string().optional(),
  source: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
});

export type CreateLeadSchema = z.infer<typeof createLeadSchema>;
export type UpdateLeadSchema = z.infer<typeof updateLeadSchema>;
export type UpdateLeadStatusSchema = z.infer<typeof updateLeadStatusSchema>;
export type CreateLeadActivitySchema = z.infer<typeof createLeadActivitySchema>;
export type AssignLeadSchema = z.infer<typeof assignLeadSchema>;
export type LeadFilterSchema = z.infer<typeof leadFilterSchema>;
