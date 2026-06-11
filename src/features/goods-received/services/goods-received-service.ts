import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateGoodsReceivedSchema, UpdateGoodsReceivedSchema, GoodsReceivedFilterSchema } from "../schemas";
import type { GoodsReceivedWithItems, GoodsReceivedWithRelations } from "../types";
import { generateReference } from "../constants";

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
              variantId: item.variantId,
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
            },
            data: {
              receivedQuantity: { increment: item.receivedQuantity },
            },
          });
        }
      }

      return goodsReceived;
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
            variantId: item.variantId,
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
