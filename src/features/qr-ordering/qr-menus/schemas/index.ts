import { z } from "zod";

export const createMenuItemSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  qrCodeId: z.string().uuid("Invalid QR code ID"),
  catalogItemId: z.string().uuid("Invalid catalog item ID"),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
  price: z.number().positive().optional(),
});

export const updateMenuItemSchema = z.object({
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  price: z.number().positive().optional().nullable(),
});

export type CreateMenuItemSchema = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemSchema = z.infer<typeof updateMenuItemSchema>;
