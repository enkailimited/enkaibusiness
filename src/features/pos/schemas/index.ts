import { z } from "zod";

export const createSessionSchema = z.object({
  storeId: z.string().uuid().optional().or(z.literal("")),
  openingFloat: z.coerce.number().min(0, "Opening float must be non-negative"),
});

export const closeSessionSchema = z.object({
  closingFloat: z.coerce.number().min(0, "Closing float must be non-negative"),
});

export const posSessionFilterSchema = z.object({
  storeId: z.string().uuid().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20),
});

export type CreateSessionSchema = z.infer<typeof createSessionSchema>;
export type CloseSessionSchema = z.infer<typeof closeSessionSchema>;
export type POSSessionFilterSchema = z.infer<typeof posSessionFilterSchema>;
