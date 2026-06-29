import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { UpdateBalanceSchema, TransferSchema } from "../schemas";
import type { BalanceWithItem } from "../types";

export async function getOrCreateBalance(
  locationId: string,
  catalogItemId: string,
  variantId?: string,
) {
  const existing = await prisma.inventoryBalance.findFirst({
    where: {
      locationId,
      catalogItemId,
      variantId: variantId ?? null,
    },
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
  });

  if (existing) {
    return {
      ...existing,
      quantityOnHand: Number(existing.quantityOnHand),
      quantityAvailable: Number(existing.quantityAvailable),
      quantityCommitted: Number(existing.quantityCommitted),
      reorderPoint: Number(existing.reorderPoint),
      maxStock: Number(existing.maxStock),
    } as BalanceWithItem;
  }

  const created = await prisma.inventoryBalance.create({
    data: { locationId, catalogItemId, variantId: variantId ?? null },
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
  });

  return {
    ...created,
    quantityOnHand: Number(created.quantityOnHand),
    quantityAvailable: Number(created.quantityAvailable),
    quantityCommitted: Number(created.quantityCommitted),
    reorderPoint: Number(created.reorderPoint),
    maxStock: Number(created.maxStock),
  } as BalanceWithItem;
}

export async function updateBalance(
  balanceId: string,
  data: UpdateBalanceSchema,
): Promise<ActionResponse & { data?: BalanceWithItem }> {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.quantityOnHand !== undefined) updateData.quantityOnHand = data.quantityOnHand;
    if (data.quantityAvailable !== undefined) updateData.quantityAvailable = data.quantityAvailable;
    if (data.quantityCommitted !== undefined) updateData.quantityCommitted = data.quantityCommitted;
    if (data.reorderPoint !== undefined) updateData.reorderPoint = data.reorderPoint;
    if (data.maxStock !== undefined) updateData.maxStock = data.maxStock;
    if (data.batchNo !== undefined) updateData.batchNo = data.batchNo;
    if (data.expiryDate !== undefined) updateData.expiryDate = new Date(data.expiryDate);

    const balance = await prisma.inventoryBalance.update({
      where: { id: balanceId },
      data: updateData,
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
    });

    return {
      success: true,
      message: "Balance updated",
      data: {
        ...balance,
        quantityOnHand: Number(balance.quantityOnHand),
        quantityAvailable: Number(balance.quantityAvailable),
        quantityCommitted: Number(balance.quantityCommitted),
        reorderPoint: Number(balance.reorderPoint),
        maxStock: Number(balance.maxStock),
      } as BalanceWithItem,
    };
  } catch (error) {
    console.error("Update balance error:", error);
    return { success: false, message: "Failed to update balance" };
  }
}

export async function getBalancesByLocation(
  locationId: string,
  catalogItemId?: string,
): Promise<BalanceWithItem[]> {
  const where: Record<string, unknown> = { locationId };
  if (catalogItemId) where.catalogItemId = catalogItemId;

  const balances = await prisma.inventoryBalance.findMany({
    where,
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
  });

  return balances.map((b) => ({
    ...b,
    quantityOnHand: Number(b.quantityOnHand),
    quantityAvailable: Number(b.quantityAvailable),
    quantityCommitted: Number(b.quantityCommitted),
    reorderPoint: Number(b.reorderPoint),
    maxStock: Number(b.maxStock),
  })) as BalanceWithItem[];
}

export async function transferStock(
  data: TransferSchema,
): Promise<ActionResponse> {
  try {
    if (data.fromLocationId === data.toLocationId) {
      return { success: false, message: "Source and destination locations must differ" };
    }

    const [fromLocation, toLocation] = await Promise.all([
      prisma.inventoryLocation.findUnique({ where: { id: data.fromLocationId } }),
      prisma.inventoryLocation.findUnique({ where: { id: data.toLocationId } }),
    ]);

    if (!fromLocation) return { success: false, message: "Source location not found" };
    if (!toLocation) return { success: false, message: "Destination location not found" };

    const sourceBalance = await prisma.inventoryBalance.findFirst({
      where: {
        locationId: data.fromLocationId,
        catalogItemId: data.catalogItemId,
        variantId: data.variantId ?? null,
      },
    });

    if (!sourceBalance) {
      return { success: false, message: "Item not found in source location" };
    }

    const currentQty = Number(sourceBalance.quantityOnHand);
    if (currentQty < data.quantity) {
      return {
        success: false,
        message: `Insufficient stock. Available: ${currentQty}, Requested: ${data.quantity}`,
      };
    }

    const newSourceQty = currentQty - data.quantity;

    const destBalance = await getOrCreateBalance(
      data.toLocationId,
      data.catalogItemId,
      data.variantId,
    );

    const currentDestQty = destBalance.quantityOnHand;
    const newDestQty = currentDestQty + data.quantity;

    await prisma.$transaction([
      prisma.inventoryBalance.update({
        where: { id: sourceBalance.id },
        data: { quantityOnHand: newSourceQty, quantityAvailable: newSourceQty },
      }),
      prisma.inventoryBalance.update({
        where: { id: destBalance.id },
        data: { quantityOnHand: newDestQty, quantityAvailable: newDestQty },
      }),
      prisma.stockMovement.create({
        data: {
          locationId: data.fromLocationId,
          catalogItemId: data.catalogItemId,
          variantId: data.variantId ?? null,
          quantityChange: -data.quantity,
          balanceBefore: currentQty,
          balanceAfter: newSourceQty,
          referenceType: "transfer",
          notes: data.notes ? `Transfer out: ${data.notes}` : `Transfer to ${toLocation.name}`,
          createdById: data.createdById,
        },
      }),
      prisma.stockMovement.create({
        data: {
          locationId: data.toLocationId,
          catalogItemId: data.catalogItemId,
          variantId: data.variantId ?? null,
          quantityChange: data.quantity,
          balanceBefore: currentDestQty,
          balanceAfter: newDestQty,
          referenceType: "transfer",
          notes: data.notes ? `Transfer in: ${data.notes}` : `Transfer from ${fromLocation.name}`,
          createdById: data.createdById,
        },
      }),
    ]);

    return { success: true, message: "Stock transferred successfully" };
  } catch (error) {
    console.error("Transfer stock error:", error);
    return { success: false, message: "Failed to transfer stock" };
  }
}

export async function adjustStock(
  locationId: string,
  catalogItemId: string,
  newQuantity: number,
  variantId?: string,
  notes?: string,
  createdById?: string,
): Promise<ActionResponse> {
  try {
    const balance = await getOrCreateBalance(locationId, catalogItemId, variantId);
    const oldQty = balance.quantityOnHand;
    const change = newQuantity - oldQty;

    await prisma.$transaction([
      prisma.inventoryBalance.update({
        where: { id: balance.id },
        data: {
          quantityOnHand: newQuantity,
          quantityAvailable: newQuantity,
        },
      }),
      prisma.stockMovement.create({
        data: {
          locationId,
          catalogItemId,
          variantId: variantId ?? null,
          quantityChange: change,
          balanceBefore: oldQty,
          balanceAfter: newQuantity,
          referenceType: "adjustment",
          notes: notes ?? "Stock adjustment",
          createdById,
        },
      }),
    ]);

    return { success: true, message: "Stock adjusted" };
  } catch (error) {
    console.error("Adjust stock error:", error);
    return { success: false, message: "Failed to adjust stock" };
  }
}
