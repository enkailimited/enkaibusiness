import "server-only";

import { prisma } from "@/server/db";

export interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  workspaceCount: number;
  roleCount: number;
}

export async function listPlatformUsers(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        _count: { select: { workspaceMemberships: true, userRoles: true } },
      },
    }),
    prisma.user.count(),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      isActive: u.isActive,
      createdAt: u.createdAt,
      workspaceCount: u._count.workspaceMemberships,
      roleCount: u._count.userRoles,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function deactivateUser(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { isActive: false } });
}

export async function activateUser(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { isActive: true } });
}
