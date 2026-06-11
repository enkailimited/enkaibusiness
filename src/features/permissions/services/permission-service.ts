import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreatePermissionSchema, UpdatePermissionSchema } from "../schemas";

export async function createPermission(data: CreatePermissionSchema): Promise<ActionResponse> {
  try {
    const existing = await prisma.permission.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return { success: false, message: "A permission with this slug already exists" };
    }

    await prisma.permission.create({ data });

    return { success: true, message: "Permission created successfully" };
  } catch (error) {
    console.error("Create permission error:", error);
    return { success: false, message: "Failed to create permission" };
  }
}

export async function updatePermission(
  id: string,
  data: UpdatePermissionSchema,
): Promise<ActionResponse> {
  try {
    const existing = await prisma.permission.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, message: "Permission not found" };
    }

    await prisma.permission.update({ where: { id }, data });

    return { success: true, message: "Permission updated successfully" };
  } catch (error) {
    console.error("Update permission error:", error);
    return { success: false, message: "Failed to update permission" };
  }
}

export async function deletePermission(id: string): Promise<ActionResponse> {
  try {
    const existing = await prisma.permission.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, message: "Permission not found" };
    }

    await prisma.permission.delete({ where: { id } });

    return { success: true, message: "Permission deleted successfully" };
  } catch (error) {
    console.error("Delete permission error:", error);
    return { success: false, message: "Failed to delete permission" };
  }
}

export async function getPermission(id: string) {
  return prisma.permission.findUnique({
    where: { id },
    include: {
      rolePermissions: {
        include: {
          role: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });
}

export async function getPermissions(module?: string) {
  return prisma.permission.findMany({
    where: module ? { module } : undefined,
    orderBy: [{ module: "asc" }, { name: "asc" }],
  });
}

export async function getPermissionBySlug(slug: string) {
  return prisma.permission.findUnique({
    where: { slug },
    include: {
      rolePermissions: {
        include: {
          role: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });
}

export async function getModules() {
  const result = await prisma.permission.findMany({
    select: { module: true },
    distinct: ["module"],
    orderBy: { module: "asc" },
  });
  return result.map((r) => r.module);
}
