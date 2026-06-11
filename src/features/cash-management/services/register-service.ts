import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateRegisterSchema, UpdateRegisterSchema, RegisterFilterSchema } from "../schemas";
import type { RegisterWithTransactions } from "../types";

export async function createRegister(
  data: CreateRegisterSchema,
  businessId: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const register = await prisma.cashRegister.create({
      data: {
        businessId,
        name: data.name,
        type: data.type,
        currency: data.currency ?? "TZS",
        openingBalance: data.openingBalance ?? 0,
        currentBalance: data.openingBalance ?? 0,
        branchId: data.branchId || null,
        storeId: data.storeId || null,
      },
    });

    return {
      success: true,
      message: "Cash register created successfully",
      data: { id: register.id },
    };
  } catch (error) {
    console.error("Create register error:", error);
    return { success: false, message: "Failed to create cash register" };
  }
}

export async function updateRegister(
  id: string,
  data: UpdateRegisterSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.openingBalance !== undefined) updateData.openingBalance = data.openingBalance;
    if (data.branchId !== undefined) updateData.branchId = data.branchId || null;
    if (data.storeId !== undefined) updateData.storeId = data.storeId || null;

    await prisma.cashRegister.update({
      where: { id },
      data: updateData,
    });

    return { success: true, message: "Cash register updated successfully", data: { id } };
  } catch (error) {
    console.error("Update register error:", error);
    return { success: false, message: "Failed to update cash register" };
  }
}

export async function getRegister(id: string): Promise<RegisterWithTransactions | null> {
  const raw = await prisma.cashRegister.findUnique({
    where: { id },
    include: {
      branch: { select: { id: true, name: true } },
      store: { select: { id: true, name: true } },
    },
  });

  if (!raw) return null;

  return {
    ...raw,
    openingBalance: raw.openingBalance.toNumber(),
    currentBalance: raw.currentBalance.toNumber(),
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  } as RegisterWithTransactions;
}

export async function listRegisters(
  businessId: string,
  filter?: RegisterFilterSchema,
): Promise<RegisterWithTransactions[]> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.type) where.type = filter.type;
  if (filter?.branchId) where.branchId = filter.branchId;
  if (filter?.storeId) where.storeId = filter.storeId;
  if (filter?.isActive !== undefined) where.isActive = filter.isActive;

  if (filter?.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const raw = await prisma.cashRegister.findMany({
    where,
    include: {
      branch: { select: { id: true, name: true } },
      store: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return raw.map((r) => ({
    ...r,
    openingBalance: r.openingBalance.toNumber(),
    currentBalance: r.currentBalance.toNumber(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  })) as RegisterWithTransactions[];
}

export async function deleteRegister(id: string): Promise<ActionResponse> {
  try {
    await prisma.cashRegister.delete({ where: { id } });
    return { success: true, message: "Cash register deleted successfully" };
  } catch (error) {
    console.error("Delete register error:", error);
    return { success: false, message: "Failed to delete cash register" };
  }
}
