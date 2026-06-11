import { z } from "zod";

export const supplierTypeEnum = z.enum(["local", "international"]);

export const createSupplierSchema = z.object({
  supplierType: supplierTypeEnum.default("local"),
  name: z.string().min(1, "Supplier name is required").max(200),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  country: z.string().min(1, "Country is required").default("Tanzania"),
  taxId: z.string().optional().or(z.literal("")),
  paymentTerms: z.string().optional().or(z.literal("")),
  currency: z.string().default("TZS"),
  isActive: z.coerce.boolean().default(true),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const supplierFilterSchema = z.object({
  supplierType: z.string().optional(),
  country: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export type CreateSupplierSchema = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierSchema = z.infer<typeof updateSupplierSchema>;
export type SupplierFilterSchema = z.infer<typeof supplierFilterSchema>;
