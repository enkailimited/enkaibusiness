import { z } from "zod";

export const createUnitSchema = z.object({
  name: z
    .string()
    .min(1, "Unit name is required")
    .max(100, "Unit name is too long"),
  abbreviation: z
    .string()
    .min(1, "Abbreviation is required")
    .max(20, "Abbreviation is too long"),
  type: z.enum(["count", "weight", "volume", "length"], {
    errorMap: () => ({ message: "Type must be count, weight, volume, or length" }),
  }),
  isBase: z.boolean().default(false),
});

export const updateUnitSchema = z.object({
  name: z.string().min(1, "Unit name is required").max(100).optional(),
  abbreviation: z.string().min(1, "Abbreviation is required").max(20).optional(),
  type: z.enum(["count", "weight", "volume", "length"]).optional(),
  isBase: z.boolean().optional(),
});

export type CreateUnitSchema = z.infer<typeof createUnitSchema>;
export type UpdateUnitSchema = z.infer<typeof updateUnitSchema>;
