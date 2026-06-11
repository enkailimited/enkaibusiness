import type { Permission, RolePermission } from "@/types/models";

export interface PermissionWithRoles extends Permission {
  rolePermissions?: Array<RolePermission & { role: { id: string; name: string; slug: string } }>;
}

export interface CreatePermissionInput {
  name: string;
  slug: string;
  description?: string;
  module: string;
  action: string;
}

export interface UpdatePermissionInput {
  name?: string;
  description?: string;
  module?: string;
  action?: string;
}
