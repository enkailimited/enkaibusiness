import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreatePurchaseOrderSchema, UpdatePurchaseOrderSchema, PurchaseOrderFilterSchema } from "../schemas";
import type { PurchaseOrderWithItems, PurchaseOrderWithRelations, PurchaseOrderListItem } from "../types";

export async function createPurchaseOrder(
  data: CreatePurchaseOrderSchema,
  businessId: string,
  workspaceId: string,
  createdById?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const subtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = data.tax ?? 0;
    const total = subtotal + tax;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.purchaseOrder.create({
        data: {
          workspaceId,
          businessId,
          branchId: data.branchId || null,
          supplierId: data.supplierId,
          staffId: data.staffId || null,
          orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          status: data.status ?? "draft",
      subtotal,
      tax,
      total,
      reference: `PO-${businessId.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      notes: data.notes || null,
      createdById: createdById || null,
          items: {
            create: data.items.map((item) => ({
              catalogItemId: item.catalogItemId,
              variantId: item.variantId || null,
              quantity: item.quantity,
              unitCost: item.unitCost,
              receivedQuantity: 0,
              subtotal: item.subtotal,
            })),
          },
        },
        include: { items: true },
      });

      return created;
    });

    return {
      success: true,
      message: "Purchase order created successfully",
      data: { id: order.id },
    };
  } catch (error) {
    console.error("Create purchase order error:", error);
    return { success: false, message: "Failed to create purchase order" };
  }
}

export async function updatePurchaseOrder(
  id: string,
  data: UpdatePurchaseOrderSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    await prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
      }

      const items = data.items ?? [];
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = data.tax ?? 0;
      const total = subtotal + tax;

      await tx.purchaseOrder.update({
        where: { id },
        data: {
          branchId: data.branchId !== undefined ? (data.branchId || null) : undefined,
          supplierId: data.supplierId,
          staffId: data.staffId !== undefined ? (data.staffId || null) : undefined,
          orderDate: data.orderDate ? new Date(data.orderDate) : undefined,
          expectedDate: data.expectedDate !== undefined
            ? (data.expectedDate ? new Date(data.expectedDate) : null)
            : undefined,
          status: data.status,
          subtotal: items.length > 0 ? subtotal : undefined,
          tax,
          total: items.length > 0 ? total : undefined,
          notes: data.notes !== undefined ? (data.notes || null) : undefined,
          items: data.items
            ? {
                create: data.items.map((item) => ({
                  catalogItemId: item.catalogItemId,
                  variantId: item.variantId || null,
                  quantity: item.quantity,
                  unitCost: item.unitCost,
                  receivedQuantity: 0,
                  subtotal: item.subtotal,
                })),
              }
            : undefined,
        },
      });
    });

    return {
      success: true,
      message: "Purchase order updated successfully",
      data: { id },
    };
  } catch (error) {
    console.error("Update purchase order error:", error);
    return { success: false, message: "Failed to update purchase order" };
  }
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrderWithRelations | null> {
  const raw = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          catalogItem: {
            select: { id: true, name: true, sku: true },
          },
        },
      },
      supplier: { select: { id: true, name: true } },
      staff: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!raw) return null;

  return {
    ...raw,
    orderDate: raw.orderDate.toISOString(),
    expectedDate: raw.expectedDate?.toISOString() ?? null,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    reference: raw.reference,
    subtotal: Number(raw.subtotal),
    tax: Number(raw.tax),
    total: Number(raw.total),
    items: raw.items.map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      unitCost: Number(i.unitCost),
      receivedQuantity: Number(i.receivedQuantity),
      subtotal: Number(i.subtotal),
    })),
  } as unknown as PurchaseOrderWithRelations;
}

export async function getBusinessPurchaseOrders(
  businessId: string,
  filter?: PurchaseOrderFilterSchema,
): Promise<PurchaseOrderListItem[]> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.supplierId) {
    where.supplierId = filter.supplierId;
  }

  if (filter?.status) {
    where.status = filter.status;
  }

  if (filter?.dateFrom || filter?.dateTo) {
    where.orderDate = {};
    if (filter.dateFrom) where.orderDate.gte = new Date(filter.dateFrom);
    if (filter.dateTo) where.orderDate.lte = new Date(filter.dateTo);
  }

  if (filter?.search) {
    where.OR = [
      { supplier: { name: { contains: filter.search, mode: "insensitive" } } },
      { notes: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const take = filter?.limit ?? 20;
  const skip = ((filter?.page ?? 1) - 1) * take;

  const raw = await prisma.purchaseOrder.findMany({
    where,
    include: {
      supplier: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { orderDate: "desc" },
    skip,
    take,
  });

  return raw.map((p) => ({
    ...p,
    orderDate: p.orderDate.toISOString(),
    expectedDate: p.expectedDate?.toISOString() ?? null,
    reference: p.reference,
    subtotal: Number(p.subtotal),
    tax: Number(p.tax),
    total: Number(p.total),
  })) as unknown as PurchaseOrderListItem[];
}

export async function deletePurchaseOrder(id: string): Promise<ActionResponse> {
  try {
    await prisma.purchaseOrder.delete({ where: { id } });
    return { success: true, message: "Purchase order deleted successfully" };
  } catch (error) {
    console.error("Delete purchase order error:", error);
    return { success: false, message: "Failed to delete purchase order" };
  }
}

export async function approvePurchaseOrder(id: string): Promise<ActionResponse> {
  try {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) return { success: false, message: "Purchase order not found" };
    if (existing.status !== "sent") {
      return { success: false, message: "Only sent orders can be approved" };
    }

    await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "approved" },
    });

    return { success: true, message: "Purchase order approved" };
  } catch (error) {
    console.error("Approve purchase order error:", error);
    return { success: false, message: "Failed to approve purchase order" };
  }
}

export async function markPurchaseOrderAsSent(id: string): Promise<ActionResponse> {
  try {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) return { success: false, message: "Purchase order not found" };
    if (existing.status !== "draft") {
      return { success: false, message: "Only draft orders can be sent" };
    }

    await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "sent" },
    });

    return { success: true, message: "Purchase order sent to supplier" };
  } catch (error) {
    console.error("Send purchase order error:", error);
    return { success: false, message: "Failed to send purchase order" };
  }
}

export async function markPurchaseOrderAsReceived(id: string): Promise<ActionResponse> {
  try {
    const existing = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) return { success: false, message: "Purchase order not found" };
    if (existing.status !== "approved") {
      return { success: false, message: "Only approved orders can be received" };
    }

    const goodsReceivedCount = await prisma.goodsReceived.count({
      where: { purchaseOrderId: id },
    });

    if (goodsReceivedCount > 0) {
      await prisma.purchaseOrder.update({
        where: { id },
        data: { status: "received" },
      });
      return { success: true, message: "Purchase order marked as received (already received via goods received)" };
    }

    const location = await prisma.inventoryLocation.findFirst({
      where: { businessId: existing.businessId, isActive: true, ...(existing.branchId ? { branchId: existing.branchId } : {}) },
      orderBy: { createdAt: "asc" },
    });

    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id },
        data: { status: "received" },
      });

      let totalItemsCost = 0;
      const purchaseItems: Array<{
        catalogItemId: string;
        variantId: string | null;
        quantity: number;
        unitCost: number;
        subtotal: number;
      }> = [];

      for (const item of existing.items) {
        const qty = Number(item.quantity);
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQuantity: qty },
        });

        if (!location) continue;

        const catalogItem = await tx.catalogItem.findUnique({
          where: { id: item.catalogItemId },
          select: { trackStock: true, costPrice: true },
        });

        const unitCost = catalogItem?.costPrice ? Number(catalogItem.costPrice) : 0;
        const subtotal = qty * unitCost;
        totalItemsCost += subtotal;
        purchaseItems.push({ catalogItemId: item.catalogItemId, variantId: item.variantId ?? null, quantity: qty, unitCost, subtotal });

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
        const newQty = currentQty + qty;

        await tx.inventoryBalance.update({
          where: { id: balance.id },
          data: { quantityOnHand: newQty, quantityAvailable: newQty },
        });

        await tx.stockMovement.create({
          data: {
            locationId: location.id,
            catalogItemId: item.catalogItemId,
            variantId: item.variantId || null,
            quantityChange: qty,
            balanceBefore: currentQty,
            balanceAfter: newQty,
            referenceType: "purchase",
            reference: id,
            notes: `Purchase order received ${existing.reference || existing.id}`,
          },
        });
      }

      if (purchaseItems.length > 0) {
        await tx.purchase.create({
          data: {
            workspaceId: existing.workspaceId,
            businessId: existing.businessId,
            branchId: existing.branchId || null,
            supplierId: existing.supplierId,
            purchaseDate: new Date(),
            reference: existing.reference || undefined,
            status: "unpaid",
            paidAmount: 0,
            balanceDue: totalItemsCost,
            subtotal: totalItemsCost,
            tax: 0,
            total: totalItemsCost,
            notes: `Auto-created from PO received ${existing.reference || existing.id}`,
            items: {
              create: purchaseItems.map((pi) => ({
                catalogItemId: pi.catalogItemId,
                variantId: pi.variantId,
                quantity: pi.quantity,
                unitCost: pi.unitCost,
                subtotal: pi.subtotal,
              })),
            },
          },
        });
      }
    });

    return { success: true, message: "Purchase order marked as received" };
  } catch (error) {
    console.error("Receive purchase order error:", error);
    return { success: false, message: "Failed to receive purchase order" };
  }
}
