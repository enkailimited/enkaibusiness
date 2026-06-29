import { z } from "zod";

const variantSchema = z.object({
  name: z.string().min(1).max(300),
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createCatalogItemSchema = z.object({
  name: z
    .string()
    .min(1, "Item name is required")
    .max(300, "Item name is too long"),
  description: z.string().max(1000).optional().or(z.literal("")),
  sku: z.string().max(100).optional().or(z.literal("")),
  barcode: z.string().max(100).optional().or(z.literal("")),
  itemType: z.enum(["PRODUCT", "SERVICE", "MEDICINE", "MENU_ITEM"]),
  catalogTypeId: z.string().uuid().optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  brandId: z.string().uuid().optional().or(z.literal("")),
  unitId: z.string().uuid().optional().or(z.literal("")),
  isService: z.boolean().default(false),
  trackStock: z.boolean().default(true),
  imageUrl: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
  variants: z.array(variantSchema).optional(),
});

export const updateCatalogItemSchema = createCatalogItemSchema.partial();

export type CreateCatalogItemSchema = z.infer<typeof createCatalogItemSchema>;
export type UpdateCatalogItemSchema = z.infer<typeof updateCatalogItemSchema>;
