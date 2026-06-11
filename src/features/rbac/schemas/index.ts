import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  slug: z.string().min(1, "Slug is required").max(50).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
  scope: z.enum(["PLATFORM", "BUSINESS"]),
  businessId: z.string().optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
});

export const createPermissionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9.:-]+$/),
  module: z.string().min(1, "Module is required"),
  action: z.string().min(1, "Action is required"),
  description: z.string().optional(),
});

export const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  businessId: z.string().uuid().optional(),
});

export const assignPermissionSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
});
