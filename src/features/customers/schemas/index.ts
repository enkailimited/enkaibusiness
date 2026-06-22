import { z } from "zod";

export const customerTypeEnum = z.enum(["RETAIL", "WHOLESALE", "WALK_IN"]);

export const createCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().max(100).optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  customerType: customerTypeEnum.default("RETAIL"),
  customerGroupId: z.string().uuid().optional().or(z.literal("")),
  creditLimit: z.coerce.number().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerFilterSchema = z.object({
  customerType: z.string().optional(),
  customerGroupId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export type CreateCustomerSchema = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerSchema = z.infer<typeof updateCustomerSchema>;
export type CustomerFilterSchema = z.infer<typeof customerFilterSchema>;
