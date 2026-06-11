import { z } from "zod";
import { REFERENCE_TYPES } from "../constants";

export const createMovementSchema = z.object({
  locationId: z.string().uuid("Invalid location ID"),
  catalogItemId: z.string().uuid("Invalid catalog item ID"),
  variantId: z.string().uuid().optional(),
  quantityChange: z.coerce.number(),
  balanceBefore: z.coerce.number().min(0),
  balanceAfter: z.coerce.number().min(0),
  reference: z.string().max(100).optional(),
  referenceType: z.enum(REFERENCE_TYPES, {
    errorMap: () => ({ message: `Type must be one of: ${REFERENCE_TYPES.join(", ")}` }),
  }),
  notes: z.string().optional(),
  createdById: z.string().uuid().optional(),
});

export const movementFilterSchema = z.object({
  locationId: z.string().uuid().optional(),
  catalogItemId: z.string().uuid().optional(),
  referenceType: z.enum(REFERENCE_TYPES).optional(),
  reference: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type CreateMovementSchema = z.infer<typeof createMovementSchema>;
export type MovementFilterSchema = z.infer<typeof movementFilterSchema>;
