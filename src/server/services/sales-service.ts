import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type {
  CreateSalesHierarchySchema,
  CreateSalesProfileSchema,
  UpdateSalesProfileSchema,
} from "@/lib/validations/sales";

export async function getSalesHierarchy() {
  return prisma.salesHierarchy.findMany({
    orderBy: { level: "asc" },
  });
}

export async function createSalesHierarchy(
  data: CreateSalesHierarchySchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const hierarchy = await prisma.salesHierarchy.create({ data });
    return {
      success: true,
      message: "Sales hierarchy level created successfully",
      data: { id: hierarchy.id },
    };
  } catch (error) {
    console.error("Create sales hierarchy error:", error);
    return { success: false, message: "Failed to create sales hierarchy level" };
  }
}

export async function updateSalesHierarchy(
  id: string,
  data: Partial<CreateSalesHierarchySchema>,
): Promise<ActionResponse> {
  try {
    await prisma.salesHierarchy.update({ where: { id }, data });
    return { success: true, message: "Sales hierarchy level updated successfully" };
  } catch (error) {
    console.error("Update sales hierarchy error:", error);
    return { success: false, message: "Failed to update sales hierarchy level" };
  }
}

export async function deleteSalesHierarchy(id: string): Promise<ActionResponse> {
  try {
    await prisma.salesHierarchy.delete({ where: { id } });
    return { success: true, message: "Sales hierarchy level deleted successfully" };
  } catch (error) {
    console.error("Delete sales hierarchy error:", error);
    return { success: false, message: "Failed to delete sales hierarchy level" };
  }
}

export async function getSalesProfiles() {
  return prisma.salesProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      hierarchy: true,
      manager: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      _count: { select: { subordinates: true, leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSalesProfile(userId: string) {
  return prisma.salesProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      hierarchy: true,
      manager: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      subordinates: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          hierarchy: true,
        },
      },
      _count: { select: { leads: true, subordinates: true } },
    },
  });
}

export async function createSalesProfile(
  userId: string,
  data: CreateSalesProfileSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const existing = await prisma.salesProfile.findUnique({ where: { userId } });
    if (existing) {
      return { success: false, message: "User already has a sales profile" };
    }

    const profile = await prisma.salesProfile.create({
      data: {
        userId,
        phone: data.phone || null,
        photo: data.photo || null,
        region: data.region || null,
        hierarchyId: data.hierarchyId || null,
        managerId: data.managerId || null,
      },
    });

    return {
      success: true,
      message: "Sales profile created successfully",
      data: { id: profile.id },
    };
  } catch (error) {
    console.error("Create sales profile error:", error);
    return { success: false, message: "Failed to create sales profile" };
  }
}

export async function updateSalesProfile(
  userId: string,
  data: UpdateSalesProfileSchema,
): Promise<ActionResponse> {
  try {
    await prisma.salesProfile.update({
      where: { userId },
      data: {
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.photo !== undefined && { photo: data.photo || null }),
        ...(data.region !== undefined && { region: data.region || null }),
        ...(data.hierarchyId !== undefined && { hierarchyId: data.hierarchyId || null }),
        ...(data.managerId !== undefined && { managerId: data.managerId || null }),
      },
    });
    return { success: true, message: "Sales profile updated successfully" };
  } catch (error) {
    console.error("Update sales profile error:", error);
    return { success: false, message: "Failed to update sales profile" };
  }
}

export async function getSubordinates(managerId: string) {
  const manager = await prisma.salesProfile.findUnique({
    where: { id: managerId },
    select: { id: true },
  });

  if (!manager) return [];

  return prisma.salesProfile.findMany({
    where: { managerId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      hierarchy: true,
      _count: { select: { subordinates: true, leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function buildSubTree(profileId: string): Promise<unknown[]> {
  const subs = await prisma.salesProfile.findMany({
    where: { managerId: profileId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      hierarchy: true,
      _count: { select: { subordinates: true, leads: true } },
    },
  });

  const result = [];
  for (const sub of subs) {
    const children = await buildSubTree(sub.id);
    result.push({ ...sub, children });
  }
  return result;
}

export async function getTeamTree(managerId: string) {
  const manager = await prisma.salesProfile.findUnique({
    where: { id: managerId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      hierarchy: true,
      _count: { select: { subordinates: true, leads: true } },
    },
  });

  if (!manager) return null;

  const children = await buildSubTree(manager.id);

  return { ...manager, children };
}

export async function getFreelancers() {
  return prisma.salesProfile.findMany({
    where: {
      hierarchy: {
        slug: "freelancer",
      },
      status: "ACTIVE",
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
