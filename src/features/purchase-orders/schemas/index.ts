import { z } from "zod";

const purchaseOrderStatusEnum = z.enum(["draft", "sent", "approved", "received", "cancelled"]);

const purchaseOrderItemSchema = z.object({
  catalogItemId: z.string().uuid("Invalid catalog item"),
  variantId: z.string().uuid().optional().or(z.literal("")),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitCost: z.coerce.number().min(0, "Unit cost must be non-negative"),
  subtotal: z.coerce.number().min(0, "Subtotal must be non-negative"),
});

export const createPurchaseOrderSchema = z.object({
  branchId: z.string().uuid().optional().or(z.literal("")),
  supplierId: z.string().uuid("Supplier is required"),
  staffId: z.string().uuid().optional().or(z.literal("")),
  orderDate: z.string().optional(),
  expectedDate: z.string().optional().or(z.literal("")),
  status: purchaseOrderStatusEnum.default("draft"),
  tax: z.coerce.number().min(0).default(0),
  notes: z.string().max(2000).optional().or(z.literal("")),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required"),
});

export const updatePurchaseOrderSchema = createPurchaseOrderSchema.partial();

export const purchaseOrderFilterSchema = z.object({
  supplierId: z.string().uuid().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20),
});

export type CreatePurchaseOrderSchema = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderSchema = z.infer<typeof updatePurchaseOrderSchema>;
export type PurchaseOrderFilterSchema = z.infer<typeof purchaseOrderFilterSchema>;
