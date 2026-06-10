import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateBusinessSchema } from "@/lib/validations/business";

export async function createBusiness(
  data: CreateBusinessSchema,
  workspaceId: string,
  userId: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const { industry, modes, ...businessData } = data;

    const business = await prisma.business.create({
      data: {
        ...businessData,
        workspaceId,
        createdById: userId,
        updatedById: userId,
        modes: {
          create: modes.map((mode) => ({
            industry,
            mode,
          })),
        },
      },
      include: { modes: true },
    });

    return {
      success: true,
      message: "Business created successfully",
      data: { id: business.id },
    };
  } catch (error) {
    console.error("Create business error:", error);
    return { success: false, message: "Failed to create business" };
  }
}

export async function updateBusiness(
  id: string,
  data: Partial<CreateBusinessSchema>,
  userId: string,
): Promise<ActionResponse> {
  try {
    const { industry, modes, ...businessData } = data;

    await prisma.business.update({
      where: { id },
      data: {
        ...businessData,
        updatedById: userId,
      },
    });

    if (industry && modes) {
      await prisma.businessMode.deleteMany({
        where: { businessId: id },
      });

      await prisma.businessMode.createMany({
        data: modes.map((mode) => ({
          businessId: id,
          industry: industry,
          mode,
        })),
      });
    }

    return { success: true, message: "Business updated successfully" };
  } catch (error) {
    console.error("Update business error:", error);
    return { success: false, message: "Failed to update business" };
  }
}

export async function getBusiness(id: string) {
  return prisma.business.findUnique({
    where: { id },
    include: {
      modes: true,
      branches: {
        include: { _count: { select: { stores: true } } },
      },
      _count: { select: { branches: true } },
    },
  });
}

export async function getWorkspaceBusinesses(workspaceId: string) {
  return prisma.business.findMany({
    where: { workspaceId, isActive: true },
    include: {
      modes: true,
      _count: { select: { branches: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function deleteBusiness(id: string): Promise<ActionResponse> {
  try {
    await prisma.business.delete({ where: { id } });
    return { success: true, message: "Business deleted successfully" };
  } catch (error) {
    console.error("Delete business error:", error);
    return { success: false, message: "Failed to delete business" };
  }
}
