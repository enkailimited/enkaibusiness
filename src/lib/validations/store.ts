import { z } from "zod";

export const createStoreSchema = z.object({
  name: z
    .string()
    .min(1, "Store name is required")
    .max(200, "Store name is too long"),
  code: z.string().max(50).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
});

export const updateStoreSchema = createStoreSchema.partial();

export type CreateStoreSchema = z.infer<typeof createStoreSchema>;
export type UpdateStoreSchema = z.infer<typeof updateStoreSchema>;
