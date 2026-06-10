import { z } from "zod";

export const createCatalogItemSchema = z.object({
  name: z
    .string()
    .min(1, "Item name is required")
    .max(300, "Item name is too long"),
  description: z.string().max(1000).optional().or(z.literal("")),
  sku: z.string().max(100).optional().or(z.literal("")),
  barcode: z.string().max(100).optional().or(z.literal("")),
  itemType: z.enum(["PRODUCT", "SERVICE", "MEDICINE", "MENU_ITEM"]),
  category: z.string().max(100).optional().or(z.literal("")),
  unit: z.string().max(50).optional().or(z.literal("")),
  price: z.number().min(0, "Price must be non-negative"),
  costPrice: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  currency: z.string().default("TZS"),
  isService: z.boolean().default(false),
  trackStock: z.boolean().default(true),
});

export const updateCatalogItemSchema = createCatalogItemSchema.partial();

export type CreateCatalogItemSchema = z.infer<typeof createCatalogItemSchema>;
export type UpdateCatalogItemSchema = z.infer<typeof updateCatalogItemSchema>;
