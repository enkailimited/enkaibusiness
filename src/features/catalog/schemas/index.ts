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
  categoryId: z.string().uuid().optional().or(z.literal("")),
  brandId: z.string().uuid().optional().or(z.literal("")),
  unitId: z.string().uuid().optional().or(z.literal("")),
  price: z.number().min(0, "Price must be non-negative"),
  costPrice: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  currency: z.string().default("TZS"),
  isService: z.boolean().default(false),
  trackStock: z.boolean().default(true),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export const updateCatalogItemSchema = createCatalogItemSchema.partial();

export type CreateCatalogItemSchema = z.infer<typeof createCatalogItemSchema>;
export type UpdateCatalogItemSchema = z.infer<typeof updateCatalogItemSchema>;
