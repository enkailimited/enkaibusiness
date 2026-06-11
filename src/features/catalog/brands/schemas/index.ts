import { z } from "zod";

export const createBrandSchema = z.object({
  name: z
    .string()
    .min(1, "Brand name is required")
    .max(200, "Brand name is too long"),
  description: z.string().max(500).optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export const updateBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(200).optional(),
  description: z.string().max(500).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateBrandSchema = z.infer<typeof createBrandSchema>;
export type UpdateBrandSchema = z.infer<typeof updateBrandSchema>;
