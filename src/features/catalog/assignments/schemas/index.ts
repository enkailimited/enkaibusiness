import { z } from "zod";

export const createAssignmentSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  catalogItemId: z.string().uuid("Invalid catalog item ID"),
  branchId: z.string().uuid("Invalid branch ID").optional().or(z.literal("")),
  storeId: z.string().uuid("Invalid store ID").optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateAssignmentSchema = z.object({
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateAssignmentSchema = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentSchema = z.infer<typeof updateAssignmentSchema>;
