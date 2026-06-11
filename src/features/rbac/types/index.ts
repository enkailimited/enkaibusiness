import type { Role, Permission, RolePermission } from "@prisma/client";

export type RoleWithPermissions = Role & {
  rolePermissions: Array<RolePermission & { permission: Permission }>;
};

export type RoleWithUserCount = Role & {
  _count: { userRoles: number };
};

export type RoleScope = "PLATFORM" | "BUSINESS";

export interface RoleInput {
  name: string;
  slug: string;
  description?: string;
  scope: RoleScope;
  businessId?: string;
}

export interface PermissionInput {
  name: string;
  slug: string;
  module: string;
  action: string;
  description?: string;
}
