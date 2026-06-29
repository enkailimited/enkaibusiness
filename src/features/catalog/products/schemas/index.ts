import { z } from "zod";

export const variantSchema = z.object({
  name: z.string().min(1, "Variant name is required").max(300),
  sku: z.string().max(100).optional().or(z.literal("")),
  barcode: z.string().max(100).optional().or(z.literal("")),
  price: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  attributes: z.record(z.unknown()).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(300),
  description: z.string().max(1000).optional().or(z.literal("")),
  sku: z.string().max(100).optional().or(z.literal("")),
  barcode: z.string().max(100).optional().or(z.literal("")),
  itemType: z.literal("PRODUCT"),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  brandId: z.string().uuid().optional().or(z.literal("")),
  unitId: z.string().uuid().optional().or(z.literal("")),
  price: z.number().min(0, "Price must be non-negative"),
  costPrice: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  currency: z.string().default("TZS"),
  isService: z.literal(false).default(false),
  trackStock: z.boolean().default(true),
  imageUrl: z.string().optional(),
  variants: z.array(variantSchema).optional().default([]),
});

export const updateProductSchema = createProductSchema.partial().omit({ variants: true });

export const productFilterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  sortBy: z.enum(["name", "price_asc", "price_desc", "createdAt", "updatedAt"]).optional(),
});

export type CreateProductSchema = z.infer<typeof createProductSchema>;
export type UpdateProductSchema = z.infer<typeof updateProductSchema>;
export type VariantSchema = z.infer<typeof variantSchema>;
export type ProductFilterSchema = z.infer<typeof productFilterSchema>;
