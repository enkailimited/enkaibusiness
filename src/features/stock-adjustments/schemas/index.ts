import { z } from "zod";
import { ADJUSTMENT_STATUSES } from "../constants";

export const adjustmentItemSchema = z.object({
  catalogItemId: z.string().uuid("Invalid catalog item ID"),
  variantId: z.string().uuid().optional(),
  expectedQty: z.coerce.number().min(0, "Expected qty must be >= 0"),
  actualQty: z.coerce.number().min(0, "Actual qty must be >= 0"),
  reason: z.string().max(200).optional(),
});

export const createAdjustmentSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  locationId: z.string().uuid("Invalid location ID"),
  adjustmentDate: z.coerce.date().optional(),
  reason: z.string().min(1, "Reason is required").max(500),
  notes: z.string().optional(),
  createdById: z.string().uuid().optional(),
  items: z
    .array(adjustmentItemSchema)
    .min(1, "At least one item is required")
    .transform((items) =>
      items.map((item) => ({
        ...item,
        difference: item.actualQty - item.expectedQty,
      })),
    ),
});

export const updateAdjustmentSchema = z.object({
  locationId: z.string().uuid().optional(),
  adjustmentDate: z.coerce.date().optional(),
  reason: z.string().min(1).max(500).optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        catalogItemId: z.string().uuid("Invalid catalog item ID"),
        variantId: z.string().uuid().optional(),
        expectedQty: z.coerce.number().min(0),
        actualQty: z.coerce.number().min(0),
        reason: z.string().max(200).optional(),
      }),
    )
    .optional(),
});

export const adjustmentFilterSchema = z.object({
  status: z.enum(ADJUSTMENT_STATUSES).optional(),
  locationId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateAdjustmentSchema = z.infer<typeof createAdjustmentSchema>;
export type UpdateAdjustmentSchema = z.infer<typeof updateAdjustmentSchema>;
export type AdjustmentFilterSchema = z.infer<typeof adjustmentFilterSchema>;
