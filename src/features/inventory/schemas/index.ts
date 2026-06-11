import { z } from "zod";
import { LOCATION_TYPES } from "../constants";

export const createLocationSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  branchId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long").optional(),
  isActive: z.boolean().optional(),
});

export const updateBalanceSchema = z.object({
  quantityOnHand: z.coerce.number().min(0).optional(),
  quantityAvailable: z.coerce.number().min(0).optional(),
  quantityCommitted: z.coerce.number().min(0).optional(),
  reorderPoint: z.coerce.number().min(0).optional(),
  maxStock: z.coerce.number().min(0).optional(),
  batchNo: z.string().max(100).optional(),
  expiryDate: z.string().optional(),
});

export const locationFilterSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  type: z.enum(LOCATION_TYPES).optional(),
  branchId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
});

export const transferSchema = z.object({
  fromLocationId: z.string().uuid("Invalid source location"),
  toLocationId: z.string().uuid("Invalid destination location"),
  catalogItemId: z.string().uuid("Invalid catalog item"),
  variantId: z.string().uuid().optional(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  notes: z.string().optional(),
  createdById: z.string().uuid().optional(),
});

export type CreateLocationSchema = z.infer<typeof createLocationSchema>;
export type UpdateLocationSchema = z.infer<typeof updateLocationSchema>;
export type UpdateBalanceSchema = z.infer<typeof updateBalanceSchema>;
export type LocationFilterSchema = z.infer<typeof locationFilterSchema>;
export type TransferSchema = z.infer<typeof transferSchema>;
