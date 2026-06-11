import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateLocationSchema, UpdateLocationSchema } from "../schemas";
import type { LocationWithBalances } from "../types";

function deriveType(branchId?: string, storeId?: string): string {
  if (storeId) return "store";
  if (branchId) return "branch";
  return "business";
}

export async function createLocation(
  data: CreateLocationSchema,
): Promise<ActionResponse & { data?: LocationWithBalances }> {
  try {
    const type = deriveType(data.branchId, data.storeId);

    const existing = await prisma.inventoryLocation.findUnique({
      where: {
        businessId_branchId_storeId: {
          businessId: data.businessId,
          branchId: data.branchId ?? "",
          storeId: data.storeId ?? "",
        },
      },
    });

    if (existing) {
      return { success: false, message: "Location already exists for this branch/store" };
    }

    const location = await prisma.inventoryLocation.create({
      data: {
        businessId: data.businessId,
        branchId: data.branchId,
        storeId: data.storeId,
        name: data.name,
        type,
      },
      include: {
        branch: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        _count: { select: { balances: true } },
      },
    });

    return {
      success: true,
      message: "Location created",
      data: location as unknown as LocationWithBalances,
    };
  } catch (error) {
    console.error("Create location error:", error);
    return { success: false, message: "Failed to create location" };
  }
}

export async function updateLocation(
  id: string,
  data: UpdateLocationSchema,
): Promise<ActionResponse & { data?: LocationWithBalances }> {
  try {
    const location = await prisma.inventoryLocation.update({
      where: { id },
      data,
      include: {
        branch: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        _count: { select: { balances: true } },
      },
    });

    return {
      success: true,
      message: "Location updated",
      data: location as unknown as LocationWithBalances,
    };
  } catch (error) {
    console.error("Update location error:", error);
    return { success: false, message: "Failed to update location" };
  }
}

export async function getLocation(id: string) {
  return prisma.inventoryLocation.findUnique({
    where: { id },
    include: {
      branch: { select: { id: true, name: true } },
      store: { select: { id: true, name: true } },
    },
  });
}

export async function getLocationWithBalances(id: string) {
  const location = await prisma.inventoryLocation.findUnique({
    where: { id },
    include: {
      branch: { select: { id: true, name: true } },
      store: { select: { id: true, name: true } },
      balances: {
        include: {
          catalogItem: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { catalogItem: { name: "asc" } },
      },
    },
  });

  if (!location) return null;

  return {
    ...location,
    balances: location.balances.map((b) => ({
      ...b,
      quantityOnHand: Number(b.quantityOnHand),
      quantityAvailable: Number(b.quantityAvailable),
      quantityCommitted: Number(b.quantityCommitted),
      reorderPoint: Number(b.reorderPoint),
      maxStock: Number(b.maxStock),
    })),
  } as unknown as LocationWithBalances;
}

export async function getBusinessLocations(
  businessId: string,
  typeFilter?: string,
): Promise<LocationWithBalances[]> {
  const where: Record<string, unknown> = { businessId };
  if (typeFilter) where.type = typeFilter;

  const locations = await prisma.inventoryLocation.findMany({
    where,
    include: {
      branch: { select: { id: true, name: true } },
      store: { select: { id: true, name: true } },
      _count: { select: { balances: true } },
    },
    orderBy: { name: "asc" },
  });

  return locations as unknown as LocationWithBalances[];
}

export async function deleteLocation(id: string): Promise<ActionResponse> {
  try {
    const balanceCount = await prisma.inventoryBalance.count({ where: { locationId: id } });
    if (balanceCount > 0) {
      return {
        success: false,
        message: "Cannot delete location with existing inventory. Deactivate it instead.",
      };
    }

    await prisma.inventoryLocation.delete({ where: { id } });
    return { success: true, message: "Location deleted" };
  } catch (error) {
    console.error("Delete location error:", error);
    return { success: false, message: "Failed to delete location" };
  }
}
