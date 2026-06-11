import { z } from "zod";

export const goodsReceivedItemSchema = z.object({
  catalogItemId: z.string().uuid("Invalid catalog item ID"),
  variantId: z.string().uuid().optional(),
  expectedQuantity: z.coerce.number().min(0, "Expected quantity must be >= 0"),
  receivedQuantity: z.coerce.number().min(0, "Received quantity must be >= 0"),
  unitCost: z.coerce.number().min(0, "Unit cost must be >= 0"),
});

export const createGoodsReceivedSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
  businessId: z.string().uuid("Invalid business ID"),
  branchId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  purchaseOrderId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  receivedDate: z.coerce.date().optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().optional(),
  createdById: z.string().uuid().optional(),
  items: z.array(goodsReceivedItemSchema).min(1, "At least one item is required"),
});

export const updateGoodsReceivedSchema = z.object({
  branchId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  receivedDate: z.coerce.date().optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        catalogItemId: z.string().uuid("Invalid catalog item ID"),
        variantId: z.string().uuid().optional(),
        expectedQuantity: z.coerce.number().min(0),
        receivedQuantity: z.coerce.number().min(0),
        unitCost: z.coerce.number().min(0),
      }),
    )
    .optional(),
});

export const goodsReceivedFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  purchaseOrderId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  reference: z.string().optional(),
});

export type CreateGoodsReceivedSchema = z.infer<typeof createGoodsReceivedSchema>;
export type UpdateGoodsReceivedSchema = z.infer<typeof updateGoodsReceivedSchema>;
export type GoodsReceivedFilterSchema = z.infer<typeof goodsReceivedFilterSchema>;
