import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreatePurchaseSchema, UpdatePurchaseSchema, PurchaseFilterSchema } from "../schemas";
import type { PurchaseWithItems, PurchaseWithRelations, PurchaseListItem } from "../types";

export async function createPurchase(
  data: CreatePurchaseSchema,
  businessId: string,
  workspaceId: string,
  createdById?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const subtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = data.tax ?? 0;
    const total = subtotal + tax;

    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          workspaceId,
          businessId,
          branchId: data.branchId || null,
          storeId: data.storeId || null,
          supplierId: data.supplierId,
          staffId: data.staffId || null,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
          reference: data.reference || null,
          status: data.status ?? "completed",
          subtotal,
          tax,
          total,
          notes: data.notes || null,
          createdById: createdById || null,
          items: {
            create: data.items.map((item) => ({
              catalogItemId: item.catalogItemId,
              variantId: item.variantId || null,
              quantity: item.quantity,
              unitCost: item.unitCost,
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
      message: "Purchase created successfully",
      data: { id: purchase.id },
    };
  } catch (error) {
    console.error("Create purchase error:", error);
    return { success: false, message: "Failed to create purchase" };
  }
}

export async function updatePurchase(
  id: string,
  data: UpdatePurchaseSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    await prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
      }

      const items = data.items ?? [];
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = data.tax ?? 0;
      const total = subtotal + tax;

      await tx.purchase.update({
        where: { id },
        data: {
          branchId: data.branchId !== undefined ? (data.branchId || null) : undefined,
          storeId: data.storeId !== undefined ? (data.storeId || null) : undefined,
          supplierId: data.supplierId,
          staffId: data.staffId !== undefined ? (data.staffId || null) : undefined,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
          reference: data.reference !== undefined ? (data.reference || null) : undefined,
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
                  subtotal: item.subtotal,
                })),
              }
            : undefined,
        },
      });
    });

    return {
      success: true,
      message: "Purchase updated successfully",
      data: { id },
    };
  } catch (error) {
    console.error("Update purchase error:", error);
    return { success: false, message: "Failed to update purchase" };
  }
}

export async function getPurchase(id: string): Promise<PurchaseWithRelations | null> {
  const raw = await prisma.purchase.findUnique({
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
    purchaseDate: raw.purchaseDate.toISOString(),
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    subtotal: Number(raw.subtotal),
    tax: Number(raw.tax),
    total: Number(raw.total),
    items: raw.items.map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      unitCost: Number(i.unitCost),
      subtotal: Number(i.subtotal),
    })),
  } as unknown as PurchaseWithRelations;
}

export async function getBusinessPurchases(
  businessId: string,
  filter?: PurchaseFilterSchema,
): Promise<PurchaseListItem[]> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.supplierId) {
    where.supplierId = filter.supplierId;
  }

  if (filter?.status) {
    where.status = filter.status;
  }

  if (filter?.dateFrom || filter?.dateTo) {
    where.purchaseDate = {};
    if (filter.dateFrom) where.purchaseDate.gte = new Date(filter.dateFrom);
    if (filter.dateTo) where.purchaseDate.lte = new Date(filter.dateTo);
  }

  if (filter?.search) {
    where.OR = [
      { reference: { contains: filter.search, mode: "insensitive" } },
      { supplier: { name: { contains: filter.search, mode: "insensitive" } } },
    ];
  }

  const take = filter?.limit ?? 20;
  const skip = ((filter?.page ?? 1) - 1) * take;

  const raw = await prisma.purchase.findMany({
    where,
    include: {
      supplier: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { purchaseDate: "desc" },
    skip,
    take,
  });

  return raw.map((p) => ({
    ...p,
    purchaseDate: p.purchaseDate.toISOString(),
    subtotal: Number(p.subtotal),
    tax: Number(p.tax),
    total: Number(p.total),
  })) as unknown as PurchaseListItem[];
}

export async function deletePurchase(id: string): Promise<ActionResponse> {
  try {
    await prisma.purchase.delete({ where: { id } });
    return { success: true, message: "Purchase deleted successfully" };
  } catch (error) {
    console.error("Delete purchase error:", error);
    return { success: false, message: "Failed to delete purchase" };
  }
}
