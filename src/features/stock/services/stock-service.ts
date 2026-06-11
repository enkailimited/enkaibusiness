import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateMovementSchema, MovementFilterSchema } from "../schemas";
import type { MovementWithDetails, InventorySummary } from "../types";

const movementInclude = {
  location: { select: { id: true, name: true, type: true } },
  catalogItem: { select: { id: true, name: true, sku: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
};

export async function recordMovement(
  data: CreateMovementSchema,
): Promise<ActionResponse & { data?: MovementWithDetails }> {
  try {
    const movement = await prisma.stockMovement.create({
      data: {
        locationId: data.locationId,
        catalogItemId: data.catalogItemId,
        variantId: data.variantId ?? null,
        quantityChange: data.quantityChange,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        reference: data.reference,
        referenceType: data.referenceType,
        notes: data.notes,
        createdById: data.createdById,
      },
      include: movementInclude,
    });

    return {
      success: true,
      message: "Movement recorded",
      data: {
        ...movement,
        quantityChange: Number(movement.quantityChange),
        balanceBefore: Number(movement.balanceBefore),
        balanceAfter: Number(movement.balanceAfter),
      } as MovementWithDetails,
    };
  } catch (error) {
    console.error("Record movement error:", error);
    return { success: false, message: "Failed to record movement" };
  }
}

export async function getMovementsByLocation(
  locationId: string,
  filter?: MovementFilterSchema,
): Promise<{ movements: MovementWithDetails[]; total: number }> {
  const where: Record<string, unknown> = { locationId };

  if (filter?.catalogItemId) where.catalogItemId = filter.catalogItemId;
  if (filter?.referenceType) where.referenceType = filter.referenceType;
  if (filter?.reference) where.reference = filter.reference;

  if (filter?.startDate || filter?.endDate) {
    const createdAt: Record<string, Date> = {};
    if (filter.startDate) createdAt.gte = new Date(filter.startDate);
    if (filter.endDate) createdAt.lte = new Date(filter.endDate);
    where.createdAt = createdAt;
  }

  const page = filter?.page ?? 1;
  const limit = filter?.limit ?? 50;
  const skip = (page - 1) * limit;

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: movementInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    movements: movements.map((m) => ({
      ...m,
      quantityChange: Number(m.quantityChange),
      balanceBefore: Number(m.balanceBefore),
      balanceAfter: Number(m.balanceAfter),
    })) as MovementWithDetails[],
    total,
  };
}

export async function getMovementsByItem(
  catalogItemId: string,
  filter?: { startDate?: Date; endDate?: Date },
): Promise<MovementWithDetails[]> {
  const where: Record<string, unknown> = { catalogItemId };

  if (filter?.startDate || filter?.endDate) {
    const createdAt: Record<string, Date> = {};
    if (filter.startDate) createdAt.gte = filter.startDate;
    if (filter.endDate) createdAt.lte = filter.endDate;
    where.createdAt = createdAt;
  }

  const movements = await prisma.stockMovement.findMany({
    where,
    include: movementInclude,
    orderBy: { createdAt: "desc" },
  });

  return movements.map((m) => ({
    ...m,
    quantityChange: Number(m.quantityChange),
    balanceBefore: Number(m.balanceBefore),
    balanceAfter: Number(m.balanceAfter),
  })) as MovementWithDetails[];
}

export async function getMovementsByReference(
  referenceType: string,
  reference?: string,
): Promise<MovementWithDetails[]> {
  const where: Record<string, unknown> = { referenceType };

  if (reference) where.reference = reference;

  const movements = await prisma.stockMovement.findMany({
    where,
    include: movementInclude,
    orderBy: { createdAt: "desc" },
  });

  return movements.map((m) => ({
    ...m,
    quantityChange: Number(m.quantityChange),
    balanceBefore: Number(m.balanceBefore),
    balanceAfter: Number(m.balanceAfter),
  })) as MovementWithDetails[];
}

export async function getInventorySummary(
  businessId: string,
): Promise<InventorySummary> {
  const locations = await prisma.inventoryLocation.findMany({
    where: { businessId, isActive: true },
    select: { id: true },
  });

  const locationIds = locations.map((l) => l.id);

  const [balanceData, itemCount, lowStockCount, outOfStockCount] = await Promise.all([
    prisma.inventoryBalance.aggregate({
      where: { locationId: { in: locationIds } },
      _sum: { quantityOnHand: true },
    }),
    prisma.inventoryBalance.count({
      where: { locationId: { in: locationIds } },
    }),
    prisma.inventoryBalance.count({
      where: {
        locationId: { in: locationIds },
        quantityOnHand: { lte: prisma.inventoryBalance.fields.reorderPoint },
        quantityOnHand: { gt: 0 },
      },
    }),
    prisma.inventoryBalance.count({
      where: {
        locationId: { in: locationIds },
        quantityOnHand: { equals: 0 },
      },
    }),
  ]);

  return {
    totalItems: itemCount,
    totalStockValue: Number(balanceData._sum.quantityOnHand) || 0,
    lowStockItems: lowStockCount,
    outOfStockItems: outOfStockCount,
    totalLocations: locationIds.length,
  };
}
