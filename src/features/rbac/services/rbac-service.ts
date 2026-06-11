import "server-only";

import { prisma } from "@/server/db";
import type { RoleScope } from "@prisma/client";

export async function createRole(data: { name: string; slug: string; description?: string; scope: RoleScope; isSystem?: boolean; businessId?: string }) {
  return prisma.role.create({ data });
}

export async function updateRole(id: string, data: { name?: string; description?: string }) {
  return prisma.role.update({ where: { id }, data });
}

export async function deleteRole(id: string) {
  return prisma.role.delete({ where: { id } });
}

export async function getRole(id: string) {
  return prisma.role.findUnique({
    where: { id },
    include: {
      rolePermissions: { include: { permission: true } },
      _count: { select: { userRoles: true } },
    },
  });
}

export async function getRoles(scope?: RoleScope, businessId?: string) {
  return prisma.role.findMany({
    where: { scope, businessId } as Record<string, unknown>,
    include: { _count: { select: { userRoles: true, rolePermissions: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createPermission(data: { name: string; slug: string; module: string; action: string; description?: string }) {
  return prisma.permission.create({ data });
}

export async function getPermissions(module?: string) {
  const where = module ? { module } : {};
  return prisma.permission.findMany({
    where,
    orderBy: [{ module: "asc" }, { action: "asc" }],
  });
}

export async function assignPermissionToRole(roleId: string, permissionId: string) {
  return prisma.rolePermission.create({ data: { roleId, permissionId } });
}

export async function removePermissionFromRole(roleId: string, permissionId: string) {
  return prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
}

export async function assignRoleToUser(userId: string, roleId: string, businessId?: string) {
  return prisma.userRole.create({ data: { userId, roleId, businessId } });
}

export async function removeRoleFromUser(userId: string, roleId: string, businessId?: string) {
  return prisma.userRole.deleteMany({
    where: { userId, roleId, businessId } as Record<string, unknown>,
  });
}

export async function getUserRoles(userId: string) {
  return prisma.userRole.findMany({
    where: { userId },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  });
}

export async function hasPermission(userId: string, permissionSlug: string, businessId?: string): Promise<boolean> {
  const count = await prisma.userRole.count({
    where: {
      userId,
      businessId,
      role: { rolePermissions: { some: { permission: { slug: permissionSlug } } } },
    } as Record<string, unknown>,
  });
  return count > 0;
}

export async function hasAnyPermission(userId: string, permissionSlugs: string[], businessId?: string): Promise<boolean> {
  for (const slug of permissionSlugs) {
    if (await hasPermission(userId, slug, businessId)) return true;
  }
  return false;
}
