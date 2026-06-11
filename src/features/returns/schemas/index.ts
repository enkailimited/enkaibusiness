import { z } from "zod";

export const returnConditionEnum = z.enum(["damaged", "expired", "defective", "change_of_mind"]);

export const returnItemSchema = z.object({
  catalogItemId: z.string().uuid("Catalog item is required"),
  variantId: z.string().uuid().optional().or(z.literal("")),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price is required"),
  reason: z.string().optional().or(z.literal("")),
  condition: returnConditionEnum.optional(),
});

export const createReturnSchema = z.object({
  saleId: z.string().uuid("Sale is required"),
  storeId: z.string().uuid().optional().or(z.literal("")),
  reason: z.string().min(1, "Reason is required"),
  refundAmount: z.coerce.number().min(0, "Refund amount is required"),
  refundMethod: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  items: z.array(returnItemSchema).min(1, "At least one item is required"),
});

export const updateReturnSchema = createReturnSchema.partial();

export const returnFilterSchema = z.object({
  status: z.string().optional(),
  saleId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
});

export type CreateReturnSchema = z.infer<typeof createReturnSchema>;
export type UpdateReturnSchema = z.infer<typeof updateReturnSchema>;
export type ReturnFilterSchema = z.infer<typeof returnFilterSchema>;
