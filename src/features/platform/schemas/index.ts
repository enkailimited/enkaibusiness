import { z } from "zod";

export const platformSettingsSchema = z.object({
  appName: z.string().min(1).max(100).default("Enkai Business"),
  supportEmail: z.string().email().optional(),
  maintenanceMode: z.boolean().default(false),
  maxBusinessesPerWorkspace: z.number().int().min(1).max(1000).default(10),
  defaultLanguage: z.string().default("en"),
  defaultCurrency: z.string().default("TZS"),
  timezone: z.string().default("Africa/Dar_es_Salaam"),
});

export type PlatformSettingsSchema = z.infer<typeof platformSettingsSchema>;
