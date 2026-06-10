import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateStoreSchema } from "@/lib/validations/store";

export async function createStore(
  branchId: string,
  data: CreateStoreSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const store = await prisma.store.create({
      data: { ...data, branchId },
    });

    return {
      success: true,
      message: "Store created successfully",
      data: { id: store.id },
    };
  } catch (error) {
    console.error("Create store error:", error);
    return { success: false, message: "Failed to create store" };
  }
}

export async function updateStore(
  id: string,
  data: Partial<CreateStoreSchema>,
): Promise<ActionResponse> {
  try {
    await prisma.store.update({ where: { id }, data });
    return { success: true, message: "Store updated successfully" };
  } catch (error) {
    console.error("Update store error:", error);
    return { success: false, message: "Failed to update store" };
  }
}

export async function getStore(id: string) {
  return prisma.store.findUnique({ where: { id } });
}

export async function getBranchStores(branchId: string) {
  return prisma.store.findMany({
    where: { branchId, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function deleteStore(id: string): Promise<ActionResponse> {
  try {
    await prisma.store.delete({ where: { id } });
    return { success: true, message: "Store deleted successfully" };
  } catch (error) {
    console.error("Delete store error:", error);
    return { success: false, message: "Failed to delete store" };
  }
}
