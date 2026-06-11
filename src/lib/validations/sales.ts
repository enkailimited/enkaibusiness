import { z } from "zod";

export const createSalesProfileSchema = z.object({
  phone: z.string().optional().or(z.literal("")),
  photo: z.string().optional().or(z.literal("")),
  region: z.string().optional().or(z.literal("")),
  hierarchyId: z.string().uuid().optional().or(z.literal("")),
  managerId: z.string().uuid().optional().or(z.literal("")),
});

export const updateSalesProfileSchema = createSalesProfileSchema.partial();

export const createSalesHierarchySchema = z.object({
  level: z.number().int().min(0, "Level must be a non-negative integer"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title is too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional().or(z.literal("")),
});

export type CreateSalesProfileSchema = z.infer<typeof createSalesProfileSchema>;
export type UpdateSalesProfileSchema = z.infer<typeof updateSalesProfileSchema>;
export type CreateSalesHierarchySchema = z.infer<typeof createSalesHierarchySchema>;
