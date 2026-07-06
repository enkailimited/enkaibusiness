import { z } from "zod";

export const installerStatusEnum = z.enum(["AVAILABLE", "BUSY", "TRAVELING", "OFFLINE", "INACTIVE"]);
export const travelStatusEnum = z.enum(["en_route", "arrived", "departed", "completed", "cancelled"]);
export const photoCategoryEnum = z.enum(["site_visit", "qr_installation", "training", "verification", "completion", "other"]);

export const createInstallerSchema = z.object({
  userId: z.string().uuid(),
  employeeCode: z.string().optional(),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  photo: z.string().url().optional().or(z.literal("")),
  region: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  specialization: z.string().optional().or(z.literal("")),
  maxAssignments: z.coerce.number().int().min(1).default(5),
});

export const updateInstallerSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  photo: z.string().url().optional().or(z.literal("")),
  region: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  specialization: z.string().optional().or(z.literal("")),
  maxAssignments: z.coerce.number().int().min(1).optional(),
  employeeCode: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateInstallerStatusSchema = z.object({
  status: installerStatusEnum,
  gpsLat: z.coerce.number().min(-90).max(90).optional(),
  gpsLng: z.coerce.number().min(-180).max(180).optional(),
});

export const updateGPSSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const assignInstallerSchema = z.object({
  installerId: z.string().uuid(),
  ticketId: z.string().uuid(),
  assignedBy: z.string().uuid(),
  scheduledDate: z.string().datetime().optional(),
});

export const nearestInstallerSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(0).default(50),
});

export const updateTravelStatusSchema = z.object({
  installerId: z.string().uuid(),
  ticketId: z.string().uuid(),
  status: travelStatusEnum,
  gpsLat: z.coerce.number().min(-90).max(90).optional(),
  gpsLng: z.coerce.number().min(-180).max(180).optional(),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const addChecklistItemSchema = z.object({
  ticketId: z.string().uuid(),
  name: z.string().min(1, "Item name is required").max(200),
  isRequired: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const completeChecklistItemSchema = z.object({
  itemId: z.string().uuid(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const uploadPhotoSchema = z.object({
  ticketId: z.string().uuid(),
  url: z.string().url("Invalid photo URL"),
  category: photoCategoryEnum,
  uploadedBy: z.string().uuid(),
  caption: z.string().optional().or(z.literal("")),
});

export const getScheduleSchema = z.object({
  installerId: z.string().uuid(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const getPerformanceSchema = z.object({
  installerId: z.string().uuid(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type CreateInstallerSchema = z.infer<typeof createInstallerSchema>;
export type UpdateInstallerSchema = z.infer<typeof updateInstallerSchema>;
export type UpdateInstallerStatusSchema = z.infer<typeof updateInstallerStatusSchema>;
export type UpdateGPSSchema = z.infer<typeof updateGPSSchema>;
export type AssignInstallerSchema = z.infer<typeof assignInstallerSchema>;
export type NearestInstallerSchema = z.infer<typeof nearestInstallerSchema>;
export type UpdateTravelStatusSchema = z.infer<typeof updateTravelStatusSchema>;
export type AddChecklistItemSchema = z.infer<typeof addChecklistItemSchema>;
export type CompleteChecklistItemSchema = z.infer<typeof completeChecklistItemSchema>;
export type UploadPhotoSchema = z.infer<typeof uploadPhotoSchema>;
export type GetScheduleSchema = z.infer<typeof getScheduleSchema>;
export type GetPerformanceSchema = z.infer<typeof getPerformanceSchema>;
