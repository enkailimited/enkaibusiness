import { z } from "zod";

const saleStatusEnum = z.enum(["draft", "completed", "cancelled", "refunded"]);

const saleItemSchema = z.object({
  catalogItemId: z.string().uuid("Invalid catalog item"),
  variantId: z.string().uuid().optional().or(z.literal("")),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative"),
  discount: z.coerce.number().min(0).default(0),
  subtotal: z.coerce.number().min(0, "Subtotal must be non-negative"),
});

export const createSaleSchema = z.object({
  branchId: z.string().uuid().optional().or(z.literal("")),
  storeId: z.string().uuid().optional().or(z.literal("")),
  customerId: z.string().uuid().optional().or(z.literal("")),
  staffId: z.string().uuid().optional().or(z.literal("")),
  saleDate: z.string().optional(),
  reference: z.string().max(100).optional().or(z.literal("")),
  status: saleStatusEnum.default("completed"),
  discountTotal: z.coerce.number().min(0).default(0),
  taxTotal: z.coerce.number().min(0).default(0),
  notes: z.string().max(2000).optional().or(z.literal("")),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
});

export const updateSaleSchema = createSaleSchema.partial();

export const saleFilterSchema = z.object({
  branchId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20),
});

export type CreateSaleSchema = z.infer<typeof createSaleSchema>;
export type UpdateSaleSchema = z.infer<typeof updateSaleSchema>;
export type SaleFilterSchema = z.infer<typeof saleFilterSchema>;
