import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateAdjustmentSchema, UpdateAdjustmentSchema, AdjustmentFilterSchema } from "../schemas";
import type { AdjustmentWithRelations } from "../types";

const adjustmentInclude = {
  approvedBy: { select: { id: true, firstName: true, lastName: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  location: { select: { id: true, name: true, type: true } },
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

export async function createAdjustment(
  data: CreateAdjustmentSchema,
): Promise<ActionResponse & { data?: AdjustmentWithRelations }> {
  try {
    const adjustment = await prisma.stockAdjustment.create({
      data: {
        businessId: data.businessId,
        locationId: data.locationId,
        adjustmentDate: data.adjustmentDate ?? new Date(),
        reason: data.reason,
        notes: data.notes,
        createdById: data.createdById,
        items: {
          create: data.items.map((item) => ({
            catalogItemId: item.catalogItemId,
            variantId: item.variantId,
            expectedQty: item.expectedQty,
            actualQty: item.actualQty,
            difference: item.difference,
            reason: item.reason,
          })),
        },
      },
      include: adjustmentInclude,
    });

    return {
      success: true,
      message: "Stock adjustment created",
      data: adjustment as unknown as AdjustmentWithRelations,
    };
  } catch (error) {
    console.error("Create adjustment error:", error);
    return { success: false, message: "Failed to create adjustment" };
  }
}

export async function updateAdjustment(
  id: string,
  data: UpdateAdjustmentSchema,
): Promise<ActionResponse & { data?: AdjustmentWithRelations }> {
  try {
    const updateData: Record<string, unknown> = {};
    if (data.locationId !== undefined) updateData.locationId = data.locationId;
    if (data.adjustmentDate !== undefined) updateData.adjustmentDate = data.adjustmentDate;
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const result = await prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.stockAdjustmentItem.deleteMany({ where: { stockAdjustmentId: id } });
        await tx.stockAdjustmentItem.createMany({
          data: data.items.map((item) => ({
            stockAdjustmentId: id,
            catalogItemId: item.catalogItemId,
            variantId: item.variantId,
            expectedQty: item.expectedQty,
            actualQty: item.actualQty,
            difference: item.actualQty - item.expectedQty,
            reason: item.reason,
          })),
        });
      }

      return tx.stockAdjustment.update({
        where: { id },
        data: updateData,
        include: adjustmentInclude,
      });
    });

    return {
      success: true,
      message: "Adjustment updated",
      data: result as unknown as AdjustmentWithRelations,
    };
  } catch (error) {
    console.error("Update adjustment error:", error);
    return { success: false, message: "Failed to update adjustment" };
  }
}

export async function getAdjustment(id: string): Promise<AdjustmentWithRelations | null> {
  const raw = await prisma.stockAdjustment.findUnique({
    where: { id },
    include: adjustmentInclude,
  });

  if (!raw) return null;
  return raw as unknown as AdjustmentWithRelations;
}

export async function listAdjustments(
  businessId: string,
  filter?: AdjustmentFilterSchema,
): Promise<AdjustmentWithRelations[]> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.status) where.status = filter.status;
  if (filter?.locationId) where.locationId = filter.locationId;

  if (filter?.startDate || filter?.endDate) {
    const adjustmentDate: Record<string, Date> = {};
    if (filter.startDate) adjustmentDate.gte = filter.startDate;
    if (filter.endDate) adjustmentDate.lte = filter.endDate;
    where.adjustmentDate = adjustmentDate;
  }

  const raw = await prisma.stockAdjustment.findMany({
    where,
    include: adjustmentInclude,
    orderBy: { adjustmentDate: "desc" },
  });

  return raw as unknown as AdjustmentWithRelations[];
}

export async function deleteAdjustment(id: string): Promise<ActionResponse> {
  try {
    await prisma.stockAdjustment.delete({ where: { id } });
    return { success: true, message: "Adjustment deleted" };
  } catch (error) {
    console.error("Delete adjustment error:", error);
    return { success: false, message: "Failed to delete adjustment" };
  }
}

export async function approveAdjustment(
  id: string,
  approvedById: string,
): Promise<ActionResponse & { data?: AdjustmentWithRelations }> {
  try {
    const adjustment = await prisma.stockAdjustment.findUnique({
      where: { id },
      include: {
        items: true,
        location: { select: { id: true, name: true } },
      },
    });

    if (!adjustment) {
      return { success: false, message: "Adjustment not found" };
    }

    if (adjustment.status === "approved") {
      return { success: false, message: "Adjustment already approved" };
    }

    await prisma.$transaction(async (tx) => {
      for (const item of adjustment.items) {
        const balance = await getOrCreateBalance(
          adjustment.locationId,
          item.catalogItemId,
          item.variantId ?? undefined,
        );

        const oldQty = Number(balance.quantityOnHand);
        const newQty = oldQty + Number(item.difference);

        await tx.inventoryBalance.update({
          where: { id: balance.id },
          data: {
            quantityOnHand: newQty,
            quantityAvailable: newQty,
          },
        });

        await tx.stockMovement.create({
          data: {
            locationId: adjustment.locationId,
            catalogItemId: item.catalogItemId,
            variantId: item.variantId,
            quantityChange: Number(item.difference),
            balanceBefore: oldQty,
            balanceAfter: newQty,
            reference: `adj-${adjustment.id.substring(0, 8)}`,
            referenceType: "adjustment",
            notes: `Adjustment: ${adjustment.reason}${item.reason ? ` - ${item.reason}` : ""}`,
            createdById: approvedById,
          },
        });
      }

      await tx.stockAdjustment.update({
        where: { id },
        data: {
          status: "approved",
          approvedById,
        },
      });
    });

    const updated = await prisma.stockAdjustment.findUnique({
      where: { id },
      include: adjustmentInclude,
    });

    return {
      success: true,
      message: "Adjustment approved and stock updated",
      data: updated as unknown as AdjustmentWithRelations,
    };
  } catch (error) {
    console.error("Approve adjustment error:", error);
    return { success: false, message: "Failed to approve adjustment" };
  }
}
