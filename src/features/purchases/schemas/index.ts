import { z } from "zod";

const purchaseStatusEnum = z.enum(["unpaid", "partial", "paid", "overdue", "cancelled", "draft", "completed"]);

const purchaseItemSchema = z.object({
  catalogItemId: z.string().uuid("Invalid catalog item"),
  variantId: z.string().uuid().optional().or(z.literal("")),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitCost: z.coerce.number().min(0, "Unit cost must be non-negative"),
  subtotal: z.coerce.number().min(0, "Subtotal must be non-negative"),
});

export const createPurchaseSchema = z.object({
  branchId: z.string().uuid().optional().or(z.literal("")),
  storeId: z.string().uuid().optional().or(z.literal("")),
  supplierId: z.string().uuid("Supplier is required"),
  staffId: z.string().uuid().optional().or(z.literal("")),
  purchaseDate: z.string().optional(),
  reference: z.string().max(100).optional().or(z.literal("")),
  status: purchaseStatusEnum.default("unpaid"),
  paidAmount: z.coerce.number().min(0).default(0),
  dueDate: z.string().optional().or(z.literal("")),
  tax: z.coerce.number().min(0).default(0),
  notes: z.string().max(2000).optional().or(z.literal("")),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
});

export const updatePurchaseSchema = createPurchaseSchema.partial();

export const purchaseFilterSchema = z.object({
  branchId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20),
});

export type CreatePurchaseSchema = z.infer<typeof createPurchaseSchema>;
export type UpdatePurchaseSchema = z.infer<typeof updatePurchaseSchema>;
export type PurchaseFilterSchema = z.infer<typeof purchaseFilterSchema>;
