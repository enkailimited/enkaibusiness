import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";

export async function assignRoleToUser(
  userId: string,
  roleId: string,
  businessId?: string,
): Promise<ActionResponse> {
  try {
    const data = { userId, roleId, businessId: businessId ?? null };

    const existing = await prisma.userRole.findUnique({
      where: {
        userId_roleId_businessId: {
          userId,
          roleId,
          businessId: businessId ?? "",
        },
      },
    });

    if (existing) {
      return { success: false, message: "Role already assigned to this user" };
    }

    await prisma.userRole.create({ data });

    return { success: true, message: "Role assigned successfully" };
  } catch (error) {
    console.error("Assign role error:", error);
    return { success: false, message: "Failed to assign role" };
  }
}

export async function removeRoleFromUser(
  userId: string,
  roleId: string,
  businessId?: string,
): Promise<ActionResponse> {
  try {
    await prisma.userRole.delete({
      where: {
        userId_roleId_businessId: {
          userId,
          roleId,
          businessId: businessId ?? "",
        },
      },
    });

    return { success: true, message: "Role removed successfully" };
  } catch (error) {
    console.error("Remove role error:", error);
    return { success: false, message: "Failed to remove role" };
  }
}

export async function getUserRoles(userId: string) {
  return prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  });
}

export async function getUserRolesByBusiness(userId: string, businessId: string) {
  return prisma.userRole.findMany({
    where: { userId, businessId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  });
}

export async function hasPermission(
  userId: string,
  permissionSlug: string,
  businessId?: string,
): Promise<boolean> {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      ...(businessId ? { businessId } : {}),
    },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  return userRoles.some((ur) =>
    ur.role.rolePermissions.some((rp) => rp.permission.slug === permissionSlug),
  );
}

export async function hasAnyPermission(
  userId: string,
  permissionSlugs: string[],
  businessId?: string,
): Promise<boolean> {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      ...(businessId ? { businessId } : {}),
    },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  return userRoles.some((ur) =>
    ur.role.rolePermissions.some((rp) => permissionSlugs.includes(rp.permission.slug)),
  );
}

export async function getUsersWithRole(roleId: string) {
  return prisma.userRole.findMany({
    where: { roleId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
