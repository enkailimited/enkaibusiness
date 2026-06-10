import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateRoleSchema, CreatePermissionSchema } from "@/lib/validations/rbac";

export async function createRole(data: CreateRoleSchema): Promise<ActionResponse> {
  try {
    const slugExists = await prisma.role.findUnique({
      where: { slug: data.slug },
    });

    if (slugExists) {
      return { success: false, message: "A role with this slug already exists" };
    }

    await prisma.role.create({ data });

    return { success: true, message: "Role created successfully" };
  } catch (error) {
    console.error("Create role error:", error);
    return { success: false, message: "Failed to create role" };
  }
}

export async function updateRole(
  id: string,
  data: Partial<CreateRoleSchema>,
): Promise<ActionResponse> {
  try {
    await prisma.role.update({
      where: { id },
      data,
    });
    return { success: true, message: "Role updated successfully" };
  } catch (error) {
    console.error("Update role error:", error);
    return { success: false, message: "Failed to update role" };
  }
}

export async function deleteRole(id: string): Promise<ActionResponse> {
  try {
    await prisma.role.delete({ where: { id } });
    return { success: true, message: "Role deleted successfully" };
  } catch (error) {
    console.error("Delete role error:", error);
    return { success: false, message: "Failed to delete role" };
  }
}

export async function getRole(id: string) {
  return prisma.role.findUnique({
    where: { id },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
  });
}

export async function getRoles(scope?: "PLATFORM" | "BUSINESS") {
  return prisma.role.findMany({
    where: scope ? { scope } : undefined,
    include: {
      _count: { select: { userRoles: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createPermission(
  data: CreatePermissionSchema,
): Promise<ActionResponse> {
  try {
    await prisma.permission.create({ data });
    return { success: true, message: "Permission created successfully" };
  } catch (error) {
    console.error("Create permission error:", error);
    return { success: false, message: "Failed to create permission" };
  }
}

export async function getPermissions(module?: string) {
  return prisma.permission.findMany({
    where: module ? { module } : undefined,
    orderBy: [{ module: "asc" }, { name: "asc" }],
  });
}

export async function assignPermissionToRole(
  roleId: string,
  permissionId: string,
): Promise<ActionResponse> {
  try {
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
    });

    if (existing) {
      return { success: false, message: "Permission already assigned to this role" };
    }

    await prisma.rolePermission.create({
      data: { roleId, permissionId },
    });

    return { success: true, message: "Permission assigned successfully" };
  } catch (error) {
    console.error("Assign permission error:", error);
    return { success: false, message: "Failed to assign permission" };
  }
}

export async function removePermissionFromRole(
  roleId: string,
  permissionId: string,
): Promise<ActionResponse> {
  try {
    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
    });
    return { success: true, message: "Permission removed successfully" };
  } catch (error) {
    console.error("Remove permission error:", error);
    return { success: false, message: "Failed to remove permission" };
  }
}

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
