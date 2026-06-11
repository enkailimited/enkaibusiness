import { z } from "zod";

export const campaignStatusEnum = z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]);

export const createCampaignSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name is too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional().or(z.literal("")),
  totalQRCodes: z.number().int().nonnegative().default(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const assignQRCodeSchema = z.object({
  qrCodeIds: z
    .array(z.string().uuid("Invalid QR code ID"))
    .min(1, "At least one QR code ID is required"),
  assignedTo: z.string().min(1, "Assignee is required"),
  notes: z.string().optional().or(z.literal("")),
});

export const installQRCodeSchema = z.object({
  qrCodeId: z.string().uuid("Invalid QR code ID"),
  businessId: z.string().uuid("Invalid business ID"),
  location: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type CreateCampaignSchema = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignSchema = z.infer<typeof updateCampaignSchema>;
export type AssignQRCodeSchema = z.infer<typeof assignQRCodeSchema>;
export type InstallQRCodeSchema = z.infer<typeof installQRCodeSchema>;
