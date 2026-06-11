import "server-only";

import { prisma } from "@/server/db";

export async function listPermissions() {
  return prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { action: "asc" }],
  });
}

export async function createPermission(data: { name: string; slug: string; module: string; action: string; description?: string }) {
  return prisma.permission.create({ data });
}

export async function assignPermissionToRole(roleId: string, permissionId: string) {
  return prisma.rolePermission.create({
    data: { roleId, permissionId },
  });
}

export async function removePermissionFromRole(roleId: string, permissionId: string) {
  return prisma.rolePermission.deleteMany({
    where: { roleId, permissionId },
  });
}

export async function getRolePermissions(roleId: string) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
  });
  return role?.rolePermissions.map((rp) => rp.permission) || [];
}
