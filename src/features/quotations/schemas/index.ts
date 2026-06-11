import { z } from "zod";

const quotationStatusEnum = z.enum(["draft", "sent", "accepted", "rejected", "expired", "converted"]);

const quotationItemSchema = z.object({
  catalogItemId: z.string().uuid("Invalid catalog item"),
  variantId: z.string().uuid().optional().or(z.literal("")),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative"),
  discount: z.coerce.number().min(0).default(0),
  subtotal: z.coerce.number().min(0, "Subtotal must be non-negative"),
});

export const createQuotationSchema = z.object({
  branchId: z.string().uuid().optional().or(z.literal("")),
  customerId: z.string().uuid().optional().or(z.literal("")),
  staffId: z.string().uuid().optional().or(z.literal("")),
  quoteDate: z.string().optional(),
  expiryDate: z.string().optional().or(z.literal("")),
  status: quotationStatusEnum.default("draft"),
  tax: z.coerce.number().min(0).default(0),
  notes: z.string().max(2000).optional().or(z.literal("")),
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
});

export const updateQuotationSchema = createQuotationSchema.partial();

export const quotationFilterSchema = z.object({
  customerId: z.string().uuid().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20),
});

export type CreateQuotationSchema = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationSchema = z.infer<typeof updateQuotationSchema>;
export type QuotationFilterSchema = z.infer<typeof quotationFilterSchema>;
