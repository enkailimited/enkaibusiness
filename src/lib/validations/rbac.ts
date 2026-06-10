import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .max(100, "Role name is too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional().or(z.literal("")),
  scope: z.enum(["PLATFORM", "BUSINESS"]),
  businessId: z.string().uuid().optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

export const createPermissionSchema = z.object({
  name: z.string().min(1, "Permission name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9:.]+$/),
  description: z.string().optional().or(z.literal("")),
  module: z.string().min(1, "Module is required"),
  action: z.string().min(1, "Action is required"),
});

export const assignRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  roleId: z.string().uuid("Invalid role ID"),
  businessId: z.string().uuid().optional(),
});

export const assignPermissionSchema = z.object({
  roleId: z.string().uuid("Invalid role ID"),
  permissionId: z.string().uuid("Invalid permission ID"),
});

export type CreateRoleSchema = z.infer<typeof createRoleSchema>;
export type UpdateRoleSchema = z.infer<typeof updateRoleSchema>;
export type CreatePermissionSchema = z.infer<typeof createPermissionSchema>;
export type AssignRoleSchema = z.infer<typeof assignRoleSchema>;
