import { z } from "zod";
import { SETTING_CATEGORIES } from "../constants";

const categoryIds = SETTING_CATEGORIES.map((c) => c.id) as [string, ...string[]];

export const createSettingSchema = z.object({
  key: z.string().min(1, "Key is required").max(100),
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.unknown())]),
  type: z.enum(["string", "number", "boolean", "json"]).optional(),
  description: z.string().optional(),
  isPublic: z.coerce.boolean().default(false),
  businessId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

export const updateSettingSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.unknown())]),
  description: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
});

export const settingFilterSchema = z.object({
  category: z.enum(categoryIds).optional(),
  key: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type CreateSettingSchema = z.infer<typeof createSettingSchema>;
export type UpdateSettingSchema = z.infer<typeof updateSettingSchema>;
export type SettingFilterSchema = z.infer<typeof settingFilterSchema>;
