import { z } from "zod";
import { QRCodeStatus } from "@/types/enums";

export const createQRCodeSchema = z.object({
  campaignId: z.string().uuid("Invalid campaign ID"),
  count: z.number().int().min(1).max(1000).default(1),
});

export const assignQRCodeSchema = z.object({
  qrCodeIds: z.array(z.string().uuid()).min(1, "At least one QR code is required"),
  assignedTo: z.string().min(1, "Assignee is required"),
  notes: z.string().optional().or(z.literal("")),
});

export const installQRCodeSchema = z.object({
  qrCodeId: z.string().uuid("Invalid QR code ID"),
  businessId: z.string().uuid("Invalid business ID"),
  location: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const filterSchema = z.object({
  campaignId: z.string().uuid().optional(),
  status: z.nativeEnum(QRCodeStatus).optional(),
  businessId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
});

export type CreateQRCodeSchema = z.infer<typeof createQRCodeSchema>;
export type AssignQRCodeSchema = z.infer<typeof assignQRCodeSchema>;
export type InstallQRCodeSchema = z.infer<typeof installQRCodeSchema>;
export type QRCodeFilterSchema = z.infer<typeof filterSchema>;
