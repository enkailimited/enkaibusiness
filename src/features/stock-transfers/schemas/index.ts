import { z } from "zod";
import { TRANSFER_STATUSES } from "../constants";

export const transferItemSchema = z.object({
  catalogItemId: z.string().uuid("Invalid catalog item ID"),
  variantId: z.string().uuid().optional(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
});

export const createTransferSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  businessToId: z.string().uuid("Invalid destination business ID"),
  fromLocationId: z.string().uuid("Invalid source location ID"),
  toLocationId: z.string().uuid("Invalid destination location ID"),
  transferDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  createdById: z.string().uuid().optional(),
  items: z.array(transferItemSchema).min(1, "At least one item is required"),
});

export const updateTransferSchema = z.object({
  businessToId: z.string().uuid().optional(),
  fromLocationId: z.string().uuid().optional(),
  toLocationId: z.string().uuid().optional(),
  transferDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        catalogItemId: z.string().uuid("Invalid catalog item ID"),
        variantId: z.string().uuid().optional(),
        quantity: z.coerce.number().positive("Quantity must be positive"),
      }),
    )
    .optional(),
});

export const transferFilterSchema = z.object({
  status: z.enum(TRANSFER_STATUSES).optional(),
  fromLocationId: z.string().uuid().optional(),
  toLocationId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateTransferSchema = z.infer<typeof createTransferSchema>;
export type UpdateTransferSchema = z.infer<typeof updateTransferSchema>;
export type TransferFilterSchema = z.infer<typeof transferFilterSchema>;
