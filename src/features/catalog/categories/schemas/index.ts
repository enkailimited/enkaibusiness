import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(200, "Category name is too long"),
  parentId: z.string().uuid().optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(200).optional(),
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateCategorySchema = z.infer<typeof createCategorySchema>;
export type UpdateCategorySchema = z.infer<typeof updateCategorySchema>;
