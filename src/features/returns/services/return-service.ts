import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateReturnSchema, UpdateReturnSchema, ReturnFilterSchema } from "../schemas";
import type { ReturnWithItems, ReturnWithRelations, ReturnItemData } from "../types";
import { recordCashTransaction } from "@/features/cash-management/services/cash-integration";
import { resolveInventoryLocation } from "@/features/inventory/services/location-resolver";

function toItem(raw: Record<string, unknown>): ReturnItemData {
  return {
    ...raw,
    quantity: Number((raw as { quantity: unknown }).quantity),
    unitPrice: Number((raw as { unitPrice: unknown }).unitPrice),
  } as unknown as ReturnItemData;
}

function toReturnWithItems(raw: Record<string, unknown>): ReturnWithItems {
  return {
    ...raw,
    refundAmount: Number((raw as { refundAmount: unknown }).refundAmount),
    items: ((raw as { items: unknown }).items as Record<string, unknown>[]).map(toItem),
  } as unknown as ReturnWithItems;
}

export async function createReturn(
  data: CreateReturnSchema,
  businessId: string,
  workspaceId: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const { items, saleId, storeId, ...rest } = data;

    const result = await prisma.return.create({
      data: {
        ...rest,
        businessId,
        workspaceId,
        saleId,
        storeId: storeId || null,
        branchId: null,
        status: "draft",
        items: {
          create: items.map((item) => ({
            catalogItemId: item.catalogItemId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            reason: item.reason || null,
            condition: item.condition || null,
          })),
        },
      },
      include: { items: true },
    });

    return {
      success: true,
      message: "Return created successfully",
      data: { id: result.id },
    };
  } catch (error) {
    console.error("Create return error:", error);
    return { success: false, message: "Failed to create return" };
  }
}

export async function updateReturn(
  id: string,
  data: UpdateReturnSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const { items, ...rest } = data;

    if (items) {
      await prisma.returnItem.deleteMany({ where: { returnId: id } });

      await prisma.returnItem.createMany({
        data: items.map((item) => ({
          returnId: id,
          catalogItemId: item.catalogItemId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          reason: item.reason || null,
          condition: item.condition || null,
        })),
      });
    }

    await prisma.return.update({
      where: { id },
      data: { ...rest, storeId: rest.storeId || null },
    });

    return { success: true, message: "Return updated successfully", data: { id } };
  } catch (error) {
    console.error("Update return error:", error);
    return { success: false, message: "Failed to update return" };
  }
}

export async function getReturn(id: string): Promise<ReturnWithItems | null> {
  const raw = await prisma.return.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!raw) return null;
  return toReturnWithItems(raw as unknown as Record<string, unknown>);
}

export async function getReturnWithRelations(id: string): Promise<ReturnWithRelations | null> {
  const raw = await prisma.return.findUnique({
    where: { id },
    include: {
      items: true,
      sale: { select: { id: true } },
    },
  });
  if (!raw) return null;
  return raw as unknown as ReturnWithRelations;
}

export async function listReturns(
  businessId: string,
  filter?: ReturnFilterSchema,
): Promise<ReturnWithRelations[]> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.status) where.status = filter.status;
  if (filter?.saleId) where.saleId = filter.saleId;

  if (filter?.dateFrom || filter?.dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (filter.dateFrom) dateFilter.gte = new Date(filter.dateFrom);
    if (filter.dateTo) dateFilter.lte = new Date(filter.dateTo);
    where.returnDate = dateFilter;
  }

  if (filter?.search) {
    where.OR = [
      { reference: { contains: filter.search, mode: "insensitive" } },
      { reason: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const raw = await prisma.return.findMany({
    where,
    include: {
      items: true,
      sale: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return raw as unknown as ReturnWithRelations[];
}

export async function approveReturn(id: string): Promise<ActionResponse> {
  try {
    const ret = await prisma.return.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!ret) return { success: false, message: "Return not found" };

    await prisma.$transaction(async (tx) => {
      await tx.return.update({
        where: { id },
        data: { status: "approved" },
      });

      const location = await resolveInventoryLocation(ret.businessId, null);

      if (location) {
        for (const item of ret.items) {
          const catalogItem = await tx.catalogItem.findUnique({
            where: { id: item.catalogItemId },
            select: { trackStock: true },
          });
          if (!catalogItem?.trackStock) continue;

          let balance = await tx.inventoryBalance.findFirst({
            where: {
              locationId: location.id,
              catalogItemId: item.catalogItemId,
              variantId: item.variantId ?? null,
            },
          });

          if (balance) {
            const currentQty = Number(balance.quantityOnHand);
            const newQty = currentQty + Number(item.quantity);

            await tx.inventoryBalance.update({
              where: { id: balance.id },
              data: { quantityOnHand: newQty, quantityAvailable: newQty },
            });

            await tx.stockMovement.create({
              data: {
                locationId: location.id,
                catalogItemId: item.catalogItemId,
                variantId: item.variantId || null,
                quantityChange: Number(item.quantity),
                balanceBefore: currentQty,
                balanceAfter: newQty,
                referenceType: "return",
                reference: id,
                notes: `Return approved: ${ret.reference || id}`,
              },
            });
          }
        }
      }

      const cashPayment = await tx.payment.findFirst({
        where: { saleId: ret.saleId, status: "completed" },
        include: { paymentMethod: { select: { type: true } } },
        orderBy: { paidAt: "desc" },
      });

      if (cashPayment?.paymentMethod?.type === "cash") {
        await recordCashTransaction(
          tx,
          ret.businessId,
          ret.branchId,
          "cash_out",
          Number(ret.refundAmount),
          ret.reference || id,
          `Refund for return ${ret.reference || id}`,
        );
      }
    });

    return { success: true, message: "Return approved" };
  } catch (error) {
    console.error("Approve return error:", error);
    return { success: false, message: "Failed to approve return" };
  }
}

export async function rejectReturn(id: string): Promise<ActionResponse> {
  try {
    await prisma.return.update({
      where: { id },
      data: { status: "rejected" },
    });
    return { success: true, message: "Return rejected" };
  } catch (error) {
    console.error("Reject return error:", error);
    return { success: false, message: "Failed to reject return" };
  }
}

export async function deleteReturn(id: string): Promise<ActionResponse> {
  try {
    await prisma.return.delete({ where: { id } });
    return { success: true, message: "Return deleted successfully" };
  } catch (error) {
    console.error("Delete return error:", error);
    return { success: false, message: "Failed to delete return" };
  }
}
