import { z } from "zod";
import { CampaignStatus } from "@/types/enums";

export const createCampaignSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name is too long"),
  description: z.string().optional().or(z.literal("")),
  totalQRCodes: z.number().int().nonnegative().default(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial().extend({
  status: z.nativeEnum(CampaignStatus).optional(),
});

export const filterSchema = z.object({
  status: z.nativeEnum(CampaignStatus).optional(),
  search: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export type CreateCampaignSchema = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignSchema = z.infer<typeof updateCampaignSchema>;
export type CampaignFilterSchema = z.infer<typeof filterSchema>;
