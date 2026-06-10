import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateBranchSchema } from "@/lib/validations/branch";

export async function createBranch(
  businessId: string,
  data: CreateBranchSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const branch = await prisma.branch.create({
      data: {
        ...data,
        businessId,
      },
    });

    return {
      success: true,
      message: "Branch created successfully",
      data: { id: branch.id },
    };
  } catch (error) {
    console.error("Create branch error:", error);
    return { success: false, message: "Failed to create branch" };
  }
}

export async function updateBranch(
  id: string,
  data: Partial<CreateBranchSchema>,
): Promise<ActionResponse> {
  try {
    await prisma.branch.update({ where: { id }, data });
    return { success: true, message: "Branch updated successfully" };
  } catch (error) {
    console.error("Update branch error:", error);
    return { success: false, message: "Failed to update branch" };
  }
}

export async function getBranch(id: string) {
  return prisma.branch.findUnique({
    where: { id },
    include: {
      stores: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
  });
}

export async function getBusinessBranches(businessId: string) {
  return prisma.branch.findMany({
    where: { businessId, isActive: true },
    include: {
      _count: { select: { stores: true } },
    },
    orderBy: [{ isHeadOffice: "desc" }, { name: "asc" }],
  });
}

export async function deleteBranch(id: string): Promise<ActionResponse> {
  try {
    await prisma.branch.delete({ where: { id } });
    return { success: true, message: "Branch deleted successfully" };
  } catch (error) {
    console.error("Delete branch error:", error);
    return { success: false, message: "Failed to delete branch" };
  }
}
