import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategorySchema = z.infer<typeof createCategorySchema>;
export type UpdateCategorySchema = z.infer<typeof updateCategorySchema>;
