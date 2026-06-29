import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateTransferSchema, UpdateTransferSchema, TransferFilterSchema } from "../schemas";
import type { TransferWithRelations } from "../types";

const transferInclude = {
  business: { select: { id: true, name: true } },
  businessTo: { select: { id: true, name: true } },
  fromLocation: { select: { id: true, name: true, type: true } },
  toLocation: { select: { id: true, name: true, type: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  items: {
    include: {
      catalogItem: { select: { id: true, name: true, sku: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

async function getOrCreateBalance(
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
  });

  if (existing) return existing;

  return prisma.inventoryBalance.create({
    data: { locationId, catalogItemId, variantId: variantId ?? null },
  });
}

export async function createTransfer(
  data: CreateTransferSchema,
): Promise<ActionResponse & { data?: TransferWithRelations }> {
  try {
    if (data.fromLocationId === data.toLocationId) {
      return { success: false, message: "Source and destination locations must differ" };
    }

    const transfer = await prisma.stockTransfer.create({
      data: {
        businessId: data.businessId,
        businessToId: data.businessToId,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        transferDate: data.transferDate ?? new Date(),
        notes: data.notes,
        createdById: data.createdById,
        items: {
          create: data.items.map((item) => ({
            catalogItemId: item.catalogItemId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        },
      },
      include: transferInclude,
    });

    return {
      success: true,
      message: "Stock transfer created",
      data: transfer as unknown as TransferWithRelations,
    };
  } catch (error) {
    console.error("Create transfer error:", error);
    return { success: false, message: "Failed to create transfer" };
  }
}

export async function updateTransfer(
  id: string,
  data: UpdateTransferSchema,
): Promise<ActionResponse & { data?: TransferWithRelations }> {
  try {
    const updateData: Record<string, unknown> = {};
    if (data.businessToId !== undefined) updateData.businessToId = data.businessToId;
    if (data.fromLocationId !== undefined) updateData.fromLocationId = data.fromLocationId;
    if (data.toLocationId !== undefined) updateData.toLocationId = data.toLocationId;
    if (data.transferDate !== undefined) updateData.transferDate = data.transferDate;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const result = await prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.stockTransferItem.deleteMany({ where: { stockTransferId: id } });
        await tx.stockTransferItem.createMany({
          data: data.items.map((item) => ({
            stockTransferId: id,
            catalogItemId: item.catalogItemId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        });
      }

      return tx.stockTransfer.update({
        where: { id },
        data: updateData,
        include: transferInclude,
      });
    });

    return {
      success: true,
      message: "Transfer updated",
      data: result as unknown as TransferWithRelations,
    };
  } catch (error) {
    console.error("Update transfer error:", error);
    return { success: false, message: "Failed to update transfer" };
  }
}

export async function getTransfer(id: string): Promise<TransferWithRelations | null> {
  const raw = await prisma.stockTransfer.findUnique({
    where: { id },
    include: transferInclude,
  });

  if (!raw) return null;
  return raw as unknown as TransferWithRelations;
}

export async function listTransfers(
  businessId: string,
  filter?: TransferFilterSchema,
): Promise<TransferWithRelations[]> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.status) where.status = filter.status;
  if (filter?.fromLocationId) where.fromLocationId = filter.fromLocationId;
  if (filter?.toLocationId) where.toLocationId = filter.toLocationId;

  if (filter?.startDate || filter?.endDate) {
    const transferDate: Record<string, Date> = {};
    if (filter.startDate) transferDate.gte = filter.startDate;
    if (filter.endDate) transferDate.lte = filter.endDate;
    where.transferDate = transferDate;
  }

  const raw = await prisma.stockTransfer.findMany({
    where,
    include: transferInclude,
    orderBy: { transferDate: "desc" },
  });

  return raw as unknown as TransferWithRelations[];
}

export async function deleteTransfer(id: string): Promise<ActionResponse> {
  try {
    await prisma.stockTransfer.delete({ where: { id } });
    return { success: true, message: "Transfer deleted" };
  } catch (error) {
    console.error("Delete transfer error:", error);
    return { success: false, message: "Failed to delete transfer" };
  }
}

export async function dispatchTransfer(
  id: string,
): Promise<ActionResponse & { data?: TransferWithRelations }> {
  try {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
    });

    if (!transfer) {
      return { success: false, message: "Transfer not found" };
    }

    if (transfer.status !== "draft") {
      return { success: false, message: "Only draft transfers can be dispatched" };
    }

    const updated = await prisma.stockTransfer.update({
      where: { id },
      data: { status: "dispatched" },
      include: transferInclude,
    });

    return {
      success: true,
      message: "Transfer dispatched",
      data: updated as unknown as TransferWithRelations,
    };
  } catch (error) {
    console.error("Dispatch transfer error:", error);
    return { success: false, message: "Failed to dispatch transfer" };
  }
}

export async function receiveTransfer(
  id: string,
  items?: Array<{ id: string; receivedQuantity: number }>,
): Promise<ActionResponse & { data?: TransferWithRelations }> {
  try {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        items: true,
        fromLocation: { select: { id: true, name: true } },
        toLocation: { select: { id: true, name: true } },
      },
    });

    if (!transfer) {
      return { success: false, message: "Transfer not found" };
    }

    if (transfer.status === "received" || transfer.status === "cancelled") {
      return { success: false, message: `Cannot receive a ${transfer.status} transfer` };
    }

    await prisma.$transaction(async (tx) => {
      for (const transferItem of transfer.items) {
        const requestedQty = Number(transferItem.quantity);
        const receivedQty = items
          ? (items.find((i) => i.id === transferItem.id)?.receivedQuantity ?? requestedQty)
          : requestedQty;
        const clampedQty = Math.min(receivedQty, requestedQty);

        const fromBalance = await tx.inventoryBalance.findFirst({
          where: {
            locationId: transfer.fromLocationId,
            catalogItemId: transferItem.catalogItemId,
            variantId: transferItem.variantId ?? null,
          },
        });

        const toBalance = await getOrCreateBalance(
          transfer.toLocationId,
          transferItem.catalogItemId,
          transferItem.variantId ?? undefined,
        );

        const sourceOldQty = fromBalance ? Number(fromBalance.quantityOnHand) : 0;
        const sourceNewQty = sourceOldQty - clampedQty;
        const destOldQty = Number(toBalance.quantityOnHand);
        const destNewQty = destOldQty + clampedQty;

        if (fromBalance) {
          await tx.inventoryBalance.update({
            where: { id: fromBalance.id },
            data: {
              quantityOnHand: sourceNewQty,
              quantityAvailable: sourceNewQty,
            },
          });
        }

        await tx.inventoryBalance.update({
          where: { id: toBalance.id },
          data: {
            quantityOnHand: destNewQty,
            quantityAvailable: destNewQty,
          },
        });

        await tx.stockMovement.create({
          data: {
            locationId: transfer.fromLocationId,
            catalogItemId: transferItem.catalogItemId,
            variantId: transferItem.variantId,
            quantityChange: -clampedQty,
            balanceBefore: sourceOldQty,
            balanceAfter: sourceNewQty,
            reference: `transfer-${transfer.id.substring(0, 8)}`,
            referenceType: "transfer",
            notes: `Transfer out to ${transfer.toLocation.name}`,
          },
        });

        await tx.stockMovement.create({
          data: {
            locationId: transfer.toLocationId,
            catalogItemId: transferItem.catalogItemId,
            variantId: transferItem.variantId,
            quantityChange: clampedQty,
            balanceBefore: destOldQty,
            balanceAfter: destNewQty,
            reference: `transfer-${transfer.id.substring(0, 8)}`,
            referenceType: "transfer",
            notes: `Transfer in from ${transfer.fromLocation.name}`,
          },
        });

        await tx.stockTransferItem.update({
          where: { id: transferItem.id },
          data: { receivedQuantity: clampedQty },
        });
      }

      await tx.stockTransfer.update({
        where: { id },
        data: { status: "received" },
      });
    });

    const updated = await prisma.stockTransfer.findUnique({
      where: { id },
      include: transferInclude,
    });

    return {
      success: true,
      message: "Transfer received and stock updated",
      data: updated as unknown as TransferWithRelations,
    };
  } catch (error) {
    console.error("Receive transfer error:", error);
    return { success: false, message: "Failed to receive transfer" };
  }
}
