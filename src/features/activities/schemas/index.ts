import { z } from "zod";

export const createActivitySchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  action: z
    .string()
    .min(1, "Action is required")
    .max(100, "Action is too long"),
  resourceType: z
    .string()
    .min(1, "Resource type is required")
    .max(100, "Resource type is too long"),
  resourceId: z.string().min(1, "Resource ID is required"),
  metadata: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().optional().or(z.literal("")),
  userAgent: z.string().optional().or(z.literal("")),
});

export const activityFilterSchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateActivitySchema = z.infer<typeof createActivitySchema>;
export type ActivityFilterSchema = z.infer<typeof activityFilterSchema>;
