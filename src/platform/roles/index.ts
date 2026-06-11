import "server-only";

import { prisma } from "@/server/db";

export async function listPlatformRoles() {
  return prisma.role.findMany({
    where: { scope: "PLATFORM" },
    include: {
      _count: { select: { userRoles: true, rolePermissions: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createPlatformRole(data: { name: string; slug: string; description?: string }) {
  return prisma.role.create({
    data: { ...data, scope: "PLATFORM", isSystem: false },
  });
}

export async function assignPlatformRole(userId: string, roleId: string) {
  return prisma.userRole.create({
    data: { userId, roleId },
  });
}

export async function removePlatformRole(userId: string, roleId: string) {
  return prisma.userRole.deleteMany({
    where: { userId, roleId },
  });
}
