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

export const assignRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  roleId: z.string().uuid("Invalid role ID"),
  businessId: z.string().uuid().optional(),
});

export const assignPermissionToRoleSchema = z.object({
  roleId: z.string().uuid("Invalid role ID"),
  permissionId: z.string().uuid("Invalid permission ID"),
});

export const roleQuerySchema = z.object({
  scope: z.enum(["PLATFORM", "BUSINESS"]).optional(),
  search: z.string().optional(),
});

export type CreateRoleSchema = z.infer<typeof createRoleSchema>;
export type UpdateRoleSchema = z.infer<typeof updateRoleSchema>;
export type AssignRoleSchema = z.infer<typeof assignRoleSchema>;
export type AssignPermissionToRoleSchema = z.infer<typeof assignPermissionToRoleSchema>;
export type RoleQuerySchema = z.infer<typeof roleQuerySchema>;
