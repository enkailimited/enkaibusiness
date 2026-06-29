import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateGoodsReceivedSchema, UpdateGoodsReceivedSchema, GoodsReceivedFilterSchema } from "../schemas";
import type { GoodsReceivedWithRelations } from "../types";
import { generateReference } from "../constants";
import { resolveInventoryLocation } from "@/features/inventory/services/location-resolver";
import { emitGoodsReceived } from "@/modules/ai/events/event-bus";

const goodsReceivedInclude = {
  purchaseOrder: { select: { id: true, reference: true, status: true } },
  staff: { select: { id: true, firstName: true, lastName: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  items: {
    include: {
      catalogItem: { select: { id: true, name: true, sku: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

export async function createGoodsReceived(
  data: CreateGoodsReceivedSchema,
): Promise<ActionResponse & { data?: GoodsReceivedWithRelations }> {
  try {
    const reference = data.reference ?? generateReference();

    const catalogItemIds = [...new Set(data.items.map((i) => i.catalogItemId))];
    const catalogItems = await prisma.catalogItem.findMany({
      where: { id: { in: catalogItemIds } },
      select: { id: true, name: true, costPrice: true, trackStock: true },
    });
    const catalogMap = new Map(catalogItems.map((ci) => [ci.id, ci]));

    const result = await prisma.$transaction(async (tx) => {
      const goodsReceived = await tx.goodsReceived.create({
        data: {
          workspaceId: data.workspaceId,
          businessId: data.businessId,
          branchId: data.branchId,
          storeId: data.storeId,
          purchaseOrderId: data.purchaseOrderId,
          staffId: data.staffId,
          receivedDate: data.receivedDate ?? new Date(),
          reference,
          notes: data.notes,
          createdById: data.createdById,
          items: {
            create: data.items.map((item) => ({
              catalogItemId: item.catalogItemId,
              variantId: item.variantId ?? null,
              expectedQuantity: item.expectedQuantity,
              receivedQuantity: item.receivedQuantity,
              unitCost: item.unitCost,
            })),
          },
        },
        include: goodsReceivedInclude,
      });

      if (data.purchaseOrderId) {
        for (const item of data.items) {
          await tx.purchaseOrderItem.updateMany({
            where: {
              purchaseOrderId: data.purchaseOrderId,
              catalogItemId: item.catalogItemId,
              variantId: item.variantId ?? null,
            },
            data: {
              receivedQuantity: { increment: item.receivedQuantity },
            },
          });
        }
      }

      const location = await resolveInventoryLocation(data.businessId, data.branchId);

      if (location) {
        for (const item of data.items) {
          const catalogItem = catalogMap.get(item.catalogItemId);
          if (!catalogItem?.trackStock) continue;

          let balance = await tx.inventoryBalance.findFirst({
            where: {
              locationId: location.id,
              catalogItemId: item.catalogItemId,
              variantId: item.variantId ?? null,
            },
          });

          if (!balance) {
            balance = await tx.inventoryBalance.create({
              data: {
                locationId: location.id,
                catalogItemId: item.catalogItemId,
                variantId: item.variantId || null,
                quantityOnHand: 0,
                quantityAvailable: 0,
                quantityCommitted: 0,
              },
            });
          }

          const currentQty = Number(balance.quantityOnHand);
          const newQty = currentQty + Number(item.receivedQuantity);

          await tx.inventoryBalance.update({
            where: { id: balance.id },
            data: { quantityOnHand: newQty, quantityAvailable: newQty },
          });

          await tx.stockMovement.create({
            data: {
              locationId: location.id,
              catalogItemId: item.catalogItemId,
              variantId: item.variantId || null,
              quantityChange: Number(item.receivedQuantity),
              balanceBefore: currentQty,
              balanceAfter: newQty,
              referenceType: "purchase",
              reference: goodsReceived.id,
              notes: `Goods received ${reference}`,
              createdById: data.createdById,
            },
          });

          const unitCost = Number(item.unitCost);
          if (unitCost > 0 && catalogItem.costPrice) {
            const currentCost = Number(catalogItem.costPrice);
            const existingQty = currentQty;
            const totalCost = (currentCost * existingQty) + (unitCost * Number(item.receivedQuantity));
            const newAvgCost = totalCost / (existingQty + Number(item.receivedQuantity));
            await tx.catalogItem.update({
              where: { id: item.catalogItemId },
              data: { costPrice: Math.round(newAvgCost * 100) / 100 },
            });
          } else if (unitCost > 0) {
            await tx.catalogItem.update({
              where: { id: item.catalogItemId },
              data: { costPrice: unitCost },
            });
          }
        }
      }

      if (data.purchaseOrderId) {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: data.purchaseOrderId },
          select: { supplierId: true, workspaceId: true, branchId: true },
        });

        if (po) {
          const totalItemsCost = data.items.reduce((sum, item) => sum + Number(item.receivedQuantity) * Number(item.unitCost), 0);

          await tx.purchase.create({
            data: {
              workspaceId: po.workspaceId,
              businessId: data.businessId,
              branchId: po.branchId || data.branchId || null,
              supplierId: po.supplierId,
              purchaseDate: data.receivedDate ?? new Date(),
              reference: goodsReceived.reference || undefined,
              status: "unpaid",
              paidAmount: 0,
              balanceDue: totalItemsCost,
              subtotal: totalItemsCost,
              tax: 0,
              total: totalItemsCost,
              notes: `Auto-created from Goods Received ${goodsReceived.reference || goodsReceived.id}`,
              createdById: data.createdById,
              items: {
                create: data.items.map((item) => ({
                  catalogItemId: item.catalogItemId,
                  variantId: item.variantId ?? null,
                  quantity: item.receivedQuantity,
                  unitCost: item.unitCost,
                  subtotal: Number(item.receivedQuantity) * Number(item.unitCost),
                })),
              },
            },
          });
        }
      }

      return goodsReceived;
    });

    emitGoodsReceived(data.businessId, data.createdById ?? "", result.id, {
      reference: result.reference ?? result.id,
      purchaseOrderId: data.purchaseOrderId,
      itemCount: data.items.length,
    });

    return {
      success: true,
      message: "Goods received recorded",
      data: result as unknown as GoodsReceivedWithRelations,
    };
  } catch (error) {
    console.error("Create goods received error:", error);
    return { success: false, message: "Failed to record goods received" };
  }
}

export async function updateGoodsReceived(
  id: string,
  data: UpdateGoodsReceivedSchema,
): Promise<ActionResponse & { data?: GoodsReceivedWithRelations }> {
  try {
    const updateData: Record<string, unknown> = {};
    if (data.branchId !== undefined) updateData.branchId = data.branchId;
    if (data.storeId !== undefined) updateData.storeId = data.storeId;
    if (data.staffId !== undefined) updateData.staffId = data.staffId;
    if (data.receivedDate !== undefined) updateData.receivedDate = data.receivedDate;
    if (data.reference !== undefined) updateData.reference = data.reference;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const result = await prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.goodsReceivedItem.deleteMany({ where: { goodsReceivedId: id } });
        await tx.goodsReceivedItem.createMany({
          data: data.items.map((item) => ({
            goodsReceivedId: id,
            catalogItemId: item.catalogItemId,
            variantId: item.variantId ?? null,
            expectedQuantity: item.expectedQuantity,
            receivedQuantity: item.receivedQuantity,
            unitCost: item.unitCost,
          })),
        });
      }

      const goodsReceived = await tx.goodsReceived.update({
        where: { id },
        data: updateData,
        include: goodsReceivedInclude,
      });

      return goodsReceived;
    });

    return {
      success: true,
      message: "Goods received updated",
      data: result as unknown as GoodsReceivedWithRelations,
    };
  } catch (error) {
    console.error("Update goods received error:", error);
    return { success: false, message: "Failed to update goods received" };
  }
}

export async function getGoodsReceived(id: string): Promise<GoodsReceivedWithRelations | null> {
  const raw = await prisma.goodsReceived.findUnique({
    where: { id },
    include: goodsReceivedInclude,
  });

  if (!raw) return null;
  return raw as unknown as GoodsReceivedWithRelations;
}

export async function listGoodsReceived(
  businessId: string,
  filter?: GoodsReceivedFilterSchema,
): Promise<GoodsReceivedWithRelations[]> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.purchaseOrderId) where.purchaseOrderId = filter.purchaseOrderId;
  if (filter?.staffId) where.staffId = filter.staffId;
  if (filter?.reference) where.reference = { contains: filter.reference, mode: "insensitive" };

  if (filter?.startDate || filter?.endDate) {
    const receivedDate: Record<string, Date> = {};
    if (filter.startDate) receivedDate.gte = filter.startDate;
    if (filter.endDate) receivedDate.lte = filter.endDate;
    where.receivedDate = receivedDate;
  }

  const raw = await prisma.goodsReceived.findMany({
    where,
    include: goodsReceivedInclude,
    orderBy: { receivedDate: "desc" },
  });

  return raw as unknown as GoodsReceivedWithRelations[];
}

export async function deleteGoodsReceived(id: string): Promise<ActionResponse> {
  try {
    await prisma.goodsReceived.delete({ where: { id } });
    return { success: true, message: "Goods received deleted" };
  } catch (error) {
    console.error("Delete goods received error:", error);
    return { success: false, message: "Failed to delete goods received" };
  }
}
