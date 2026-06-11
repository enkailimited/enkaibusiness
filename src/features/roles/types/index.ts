import type { Role, RolePermission, UserRole } from "@/types/models";

export interface RoleWithPermissions extends Role {
  rolePermissions: Array<RolePermission & { permission: { id: string; name: string; slug: string; module: string; action: string } }>;
  _count?: { userRoles: number };
}

export interface RoleWithUserCount extends Role {
  _count: { userRoles: number };
}

export interface UserRoleWithRole extends UserRole {
  role: Role;
  user?: { id: string; firstName: string; lastName: string; email: string; avatarUrl: string | null };
}

export interface CreateRoleInput {
  name: string;
  slug: string;
  description?: string;
  scope: "PLATFORM" | "BUSINESS";
  businessId?: string;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  scope?: "PLATFORM" | "BUSINESS";
}

export interface AssignRoleInput {
  userId: string;
  roleId: string;
  businessId?: string;
}

export interface AssignPermissionInput {
  roleId: string;
  permissionId: string;
}
