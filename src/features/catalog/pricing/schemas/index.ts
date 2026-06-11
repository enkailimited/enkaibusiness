import { z } from "zod";

export const priceListItemSchema = z.object({
  catalogItemId: z.string().uuid("Invalid catalog item ID"),
  variantId: z.string().uuid("Invalid variant ID").optional().or(z.literal("")),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  minQuantity: z.number().min(0).default(1),
});

export const createPriceListSchema = z.object({
  name: z.string().min(1, "Price list name is required").max(200),
  type: z.enum(["retail", "wholesale", "promo"], {
    errorMap: () => ({ message: "Type must be retail, wholesale, or promo" }),
  }),
  priority: z.number().int().min(0).max(99).default(0),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  items: z.array(priceListItemSchema).optional().default([]),
});

export const updatePriceListSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["retail", "wholesale", "promo"]).optional(),
  priority: z.number().int().min(0).max(99).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const createPriceListItemSchema = priceListItemSchema;

export type CreatePriceListSchema = z.infer<typeof createPriceListSchema>;
export type UpdatePriceListSchema = z.infer<typeof updatePriceListSchema>;
export type CreatePriceListItemSchema = z.infer<typeof createPriceListItemSchema>;
