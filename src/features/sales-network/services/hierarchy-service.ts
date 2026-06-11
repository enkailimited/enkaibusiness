import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateSalesHierarchySchema, UpdateSalesHierarchySchema } from "../schemas";
import type { HierarchyWithCount } from "../types";

export async function getHierarchyLevels(): Promise<HierarchyWithCount[]> {
  return prisma.salesHierarchy.findMany({
    include: { _count: { select: { profiles: true } } },
    orderBy: { level: "asc" },
  });
}

export async function getHierarchyLevel(id: string): Promise<HierarchyWithCount | null> {
  return prisma.salesHierarchy.findUnique({
    where: { id },
    include: { _count: { select: { profiles: true } } },
  });
}

export async function createHierarchyLevel(
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
    console.error("Create hierarchy level error:", error);
    return { success: false, message: "Failed to create hierarchy level" };
  }
}

export async function updateHierarchyLevel(
  id: string,
  data: UpdateSalesHierarchySchema,
): Promise<ActionResponse> {
  try {
    await prisma.salesHierarchy.update({ where: { id }, data });
    return { success: true, message: "Hierarchy level updated successfully" };
  } catch (error) {
    console.error("Update hierarchy level error:", error);
    return { success: false, message: "Failed to update hierarchy level" };
  }
}

export async function deleteHierarchyLevel(id: string): Promise<ActionResponse> {
  try {
    await prisma.salesHierarchy.delete({ where: { id } });
    return { success: true, message: "Hierarchy level deleted successfully" };
  } catch (error) {
    console.error("Delete hierarchy level error:", error);
    return { success: false, message: "Failed to delete hierarchy level" };
  }
}
