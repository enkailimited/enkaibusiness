import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateAssignmentSchema, UpdateAssignmentSchema } from "../schemas";
import type { AssignmentWithRelations, ItemAvailability } from "../types";

const assignmentInclude = {
  branch: { select: { id: true, name: true } },
  store: { select: { id: true, name: true } },
  catalogItem: { select: { id: true, name: true, sku: true, imageUrl: true } },
};

export async function createAssignment(
  data: CreateAssignmentSchema,
): Promise<ActionResponse & { data?: AssignmentWithRelations }> {
  try {
    const existing = await prisma.catalogItemAssignment.findFirst({
      where: {
        businessId: data.businessId,
        catalogItemId: data.catalogItemId,
        branchId: data.branchId || null,
        storeId: data.storeId || null,
      },
    });

    if (existing) {
      return { success: false, message: "Assignment already exists for this item at this location" };
    }

    const maxSort = await prisma.catalogItemAssignment.aggregate({
      where: { catalogItemId: data.catalogItemId },
      _max: { sortOrder: true },
    });

    const assignment = await prisma.catalogItemAssignment.create({
      data: {
        businessId: data.businessId,
        catalogItemId: data.catalogItemId,
        branchId: data.branchId || null,
        storeId: data.storeId || null,
        isAvailable: data.isAvailable ?? true,
        sortOrder: data.sortOrder ?? (maxSort._max.sortOrder ?? -1) + 1,
      },
      include: assignmentInclude,
    });

    return {
      success: true,
      message: "Assignment created successfully",
      data: assignment as unknown as AssignmentWithRelations,
    };
  } catch (error) {
    console.error("Create assignment error:", error);
    return { success: false, message: "Failed to create assignment" };
  }
}

export async function updateAssignment(
  id: string,
  data: UpdateAssignmentSchema,
): Promise<ActionResponse & { data?: AssignmentWithRelations }> {
  try {
    const assignment = await prisma.catalogItemAssignment.update({
      where: { id },
      data,
      include: assignmentInclude,
    });

    return {
      success: true,
      message: "Assignment updated successfully",
      data: assignment as unknown as AssignmentWithRelations,
    };
  } catch (error) {
    console.error("Update assignment error:", error);
    return { success: false, message: "Failed to update assignment" };
  }
}

export async function getAssignment(id: string) {
  return prisma.catalogItemAssignment.findUnique({
    where: { id },
    include: assignmentInclude,
  }) as Promise<AssignmentWithRelations | null>;
}

export async function getAssignmentsForItem(
  catalogItemId: string,
): Promise<AssignmentWithRelations[]> {
  const assignments = await prisma.catalogItemAssignment.findMany({
    where: { catalogItemId },
    include: assignmentInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return assignments as unknown as AssignmentWithRelations[];
}

export async function getItemsAvailableAtBranch(
  branchId: string,
): Promise<ItemAvailability[]> {
  const assignments = await prisma.catalogItemAssignment.findMany({
    where: { branchId, isAvailable: true },
    include: {
      ...assignmentInclude,
      catalogItem: { select: { id: true, name: true, sku: true, imageUrl: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return aggregateByItem(assignments);
}

export async function getItemsAvailableAtStore(
  storeId: string,
): Promise<ItemAvailability[]> {
  const assignments = await prisma.catalogItemAssignment.findMany({
    where: { storeId, isAvailable: true },
    include: {
      ...assignmentInclude,
      catalogItem: { select: { id: true, name: true, sku: true, imageUrl: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return aggregateByItem(assignments);
}

function aggregateByItem(assignments: unknown[]): ItemAvailability[] {
  const map = new Map<string, ItemAvailability>();

  for (const a of assignments as AssignmentWithRelations[]) {
    if (!map.has(a.catalogItemId)) {
      map.set(a.catalogItemId, {
        catalogItemId: a.catalogItemId,
        itemName: (a as any).catalogItem?.name ?? "Unknown",
        assignments: [],
      });
    }
    map.get(a.catalogItemId)!.assignments.push(a);
  }

  return Array.from(map.values());
}

export async function removeAssignment(id: string): Promise<ActionResponse> {
  try {
    await prisma.catalogItemAssignment.delete({ where: { id } });
    return { success: true, message: "Assignment removed successfully" };
  } catch (error) {
    console.error("Remove assignment error:", error);
    return { success: false, message: "Failed to remove assignment" };
  }
}

export async function removeAssignmentForItemAtLocation(
  catalogItemId: string,
  branchId?: string,
  storeId?: string,
): Promise<ActionResponse> {
  try {
    await prisma.catalogItemAssignment.deleteMany({
      where: {
        catalogItemId,
        branchId: branchId || null,
        storeId: storeId || null,
      },
    });
    return { success: true, message: "Assignment removed successfully" };
  } catch (error) {
    console.error("Remove assignment error:", error);
    return { success: false, message: "Failed to remove assignment" };
  }
}
