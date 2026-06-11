import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateRoleSchema, UpdateRoleSchema } from "../schemas";

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
  data: UpdateRoleSchema,
): Promise<ActionResponse> {
  try {
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, message: "Role not found" };
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.role.findUnique({
        where: { slug: data.slug },
      });
      if (slugExists) {
        return { success: false, message: "A role with this slug already exists" };
      }
    }

    await prisma.role.update({ where: { id }, data });

    return { success: true, message: "Role updated successfully" };
  } catch (error) {
    console.error("Update role error:", error);
    return { success: false, message: "Failed to update role" };
  }
}

export async function deleteRole(id: string): Promise<ActionResponse> {
  try {
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, message: "Role not found" };
    }

    if (existing.isSystem) {
      return { success: false, message: "System roles cannot be deleted" };
    }

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
      _count: { select: { userRoles: true } },
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

export async function getRoleBySlug(slug: string) {
  return prisma.role.findUnique({
    where: { slug },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
      _count: { select: { userRoles: true } },
    },
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

export async function getRolePermissions(roleId: string) {
  return prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  });
}

export async function seedDefaultRoles(): Promise<ActionResponse> {
  try {
    const defaults = [
      { name: "Super Admin", slug: "super-admin", description: "Full platform access", scope: "PLATFORM" as const, isSystem: true },
      { name: "Admin", slug: "admin", description: "Platform administrator", scope: "PLATFORM" as const, isSystem: true },
      { name: "Support", slug: "support", description: "Platform support agent", scope: "PLATFORM" as const, isSystem: true },
      { name: "Business Owner", slug: "business-owner", description: "Full business access", scope: "BUSINESS" as const, isSystem: true },
      { name: "Manager", slug: "manager", description: "Business manager", scope: "BUSINESS" as const, isSystem: true },
      { name: "Staff", slug: "staff", description: "Business staff member", scope: "BUSINESS" as const, isSystem: true },
      { name: "Viewer", slug: "viewer", description: "Read-only access", scope: "BUSINESS" as const, isSystem: true },
    ];

    for (const role of defaults) {
      await prisma.role.upsert({
        where: { slug: role.slug },
        update: {},
        create: role,
      });
    }

    return { success: true, message: "Default roles seeded successfully" };
  } catch (error) {
    console.error("Seed roles error:", error);
    return { success: false, message: "Failed to seed default roles" };
  }
}
