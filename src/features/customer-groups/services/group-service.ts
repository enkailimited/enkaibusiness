import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateGroupSchema, UpdateGroupSchema } from "../schemas";
import type { CustomerGroup, CustomerGroupWithCount } from "../types";

function toGroup(raw: Record<string, unknown>): CustomerGroup {
  return {
    ...raw,
    discountPercent: Number(raw.discountPercent),
  } as unknown as CustomerGroup;
}

function toGroupWithCount(raw: Record<string, unknown>): CustomerGroupWithCount {
  return {
    ...toGroup(raw),
    _count: (raw._count ?? { customers: 0 }) as { customers: number },
  };
}

export async function createGroup(
  data: CreateGroupSchema,
  businessId: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const group = await prisma.customerGroup.create({
      data: { ...data, businessId },
    });

    return {
      success: true,
      message: "Customer group created successfully",
      data: { id: group.id },
    };
  } catch (error) {
    console.error("Create group error:", error);
    return { success: false, message: "Failed to create customer group" };
  }
}

export async function updateGroup(
  id: string,
  data: UpdateGroupSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const group = await prisma.customerGroup.update({
      where: { id },
      data,
    });

    return {
      success: true,
      message: "Customer group updated successfully",
      data: { id: group.id },
    };
  } catch (error) {
    console.error("Update group error:", error);
    return { success: false, message: "Failed to update customer group" };
  }
}

export async function getGroup(id: string): Promise<CustomerGroupWithCount | null> {
  const raw = await prisma.customerGroup.findUnique({
    where: { id },
    include: { _count: { select: { customers: true } } },
  });

  if (!raw) return null;
  return toGroupWithCount(raw as unknown as Record<string, unknown>);
}

export async function listGroups(businessId: string): Promise<CustomerGroupWithCount[]> {
  const raw = await prisma.customerGroup.findMany({
    where: { businessId },
    include: { _count: { select: { customers: true } } },
    orderBy: { name: "asc" },
  });

  return (raw as unknown as Record<string, unknown>[]).map(toGroupWithCount);
}

export async function deleteGroup(id: string): Promise<ActionResponse> {
  try {
    await prisma.customerGroup.delete({ where: { id } });
    return { success: true, message: "Customer group deleted successfully" };
  } catch (error) {
    console.error("Delete group error:", error);
    return { success: false, message: "Failed to delete customer group" };
  }
}
