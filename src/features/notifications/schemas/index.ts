import { z } from "zod";

export const notificationTypeEnum = z.enum(["alert", "info", "warning", "success"]);

export const createNotificationSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(300, "Title is too long"),
  message: z.string().optional().or(z.literal("")),
  type: notificationTypeEnum.default("info"),
  referenceType: z.string().optional().or(z.literal("")),
  referenceId: z.string().optional().or(z.literal("")),
});

export const notificationFilterSchema = z.object({
  type: notificationTypeEnum.optional(),
  isRead: z.boolean().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const markReadSchema = z.object({
  notificationId: z.string().uuid(),
});

export type CreateNotificationSchema = z.infer<typeof createNotificationSchema>;
export type NotificationFilterSchema = z.infer<typeof notificationFilterSchema>;
export type MarkReadSchema = z.infer<typeof markReadSchema>;
