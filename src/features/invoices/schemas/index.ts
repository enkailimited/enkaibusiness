import { z } from "zod";

export const invoiceItemSchema = z.object({
  catalogItemId: z.string().uuid().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price is required"),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid("Customer is required"),
  saleId: z.string().uuid().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const invoiceFilterSchema = z.object({
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
});

export type CreateInvoiceSchema = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceSchema = z.infer<typeof updateInvoiceSchema>;
export type InvoiceFilterSchema = z.infer<typeof invoiceFilterSchema>;
