import { z } from "zod";

export const createContactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().max(100).optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  title: z.string().max(200).optional().or(z.literal("")),
  organizationId: z.string().uuid().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(200),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export const createAddressSchema = z.object({
  contactId: z.string().uuid().optional().or(z.literal("")),
  businessId: z.string().uuid().optional().or(z.literal("")),
  type: z.string().default("billing"),
  line1: z.string().min(1, "Address line 1 is required").max(500),
  line2: z.string().max(500).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  postalCode: z.string().max(20).optional().or(z.literal("")),
  country: z.string().default("Tanzania"),
  isDefault: z.boolean().default(false),
});

export const createCommunicationLogSchema = z.object({
  contactId: z.string().uuid("Contact is required"),
  type: z.string().min(1, "Type is required"),
  subject: z.string().max(500).optional().or(z.literal("")),
  body: z.string().optional().or(z.literal("")),
  direction: z.string().default("outbound"),
  status: z.string().default("completed"),
  referenceId: z.string().optional().or(z.literal("")),
});

export type CreateContactSchema = z.infer<typeof createContactSchema>;
export type UpdateContactSchema = z.infer<typeof updateContactSchema>;
export type CreateOrganizationSchema = z.infer<typeof createOrganizationSchema>;
export type CreateAddressSchema = z.infer<typeof createAddressSchema>;
export type CreateCommunicationLogSchema = z.infer<typeof createCommunicationLogSchema>;
