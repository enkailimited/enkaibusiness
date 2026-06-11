import { z } from "zod";

export const createPermissionSchema = z.object({
  name: z.string().min(1, "Permission name is required").max(200, "Name is too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200, "Slug is too long")
    .regex(/^[a-z0-9:.]+$/, "Slug must contain only lowercase letters, numbers, colons, and dots"),
  description: z.string().max(500).optional().or(z.literal("")),
  module: z.string().min(1, "Module is required").max(100),
  action: z.string().min(1, "Action is required").max(100),
});

export const updatePermissionSchema = createPermissionSchema.partial();

export const permissionQuerySchema = z.object({
  module: z.string().optional(),
  search: z.string().optional(),
});

export type CreatePermissionSchema = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionSchema = z.infer<typeof updatePermissionSchema>;
export type PermissionQuerySchema = z.infer<typeof permissionQuerySchema>;
