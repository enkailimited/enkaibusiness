import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateSaleSchema, UpdateSaleSchema, SaleFilterSchema } from "../schemas";
import type { SaleWithRelations, SaleListItem } from "../types";

export async function createSale(
  data: CreateSaleSchema,
  businessId: string,
  workspaceId: string,
  createdById?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const subtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountTotal = data.discountTotal ?? 0;
    const taxTotal = data.taxTotal ?? 0;
    const grandTotal = subtotal - discountTotal + taxTotal;

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          workspaceId,
          businessId,
          branchId: data.branchId || null,
          storeId: data.storeId || null,
          customerId: data.customerId || null,
          staffId: data.staffId || null,
          saleDate: data.saleDate ? new Date(data.saleDate) : new Date(),
          reference: data.reference || null,
          status: data.status ?? "completed",
          subtotal,
          discountTotal,
          taxTotal,
          grandTotal,
          notes: data.notes || null,
          createdById: createdById || null,
          items: {
            create: data.items.map((item) => ({
              catalogItemId: item.catalogItemId,
              variantId: item.variantId || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
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
      message: "Sale created successfully",
      data: { id: sale.id },
    };
  } catch (error) {
    console.error("Create sale error:", error);
    return { success: false, message: "Failed to create sale" };
  }
}

export async function getSale(id: string): Promise<SaleWithRelations | null> {
  const raw = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          catalogItem: {
            select: { id: true, name: true, sku: true, price: true },
          },
        },
      },
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      staff: { select: { id: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { invoices: true, returns: true } },
    },
  });

  if (!raw) return null;

  return {
    ...raw,
    saleDate: raw.saleDate.toISOString(),
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    subtotal: Number(raw.subtotal),
    discountTotal: Number(raw.discountTotal),
    taxTotal: Number(raw.taxTotal),
    grandTotal: Number(raw.grandTotal),
    profitMargin: raw.profitMargin ? Number(raw.profitMargin) : null,
    items: raw.items.map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      discount: Number(i.discount),
      subtotal: Number(i.subtotal),
      costPrice: i.costPrice ? Number(i.costPrice) : null,
    })),
  } as unknown as SaleWithRelations;
}

export async function getBusinessSales(
  businessId: string,
  filter?: SaleFilterSchema,
): Promise<SaleListItem[]> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.branchId) where.branchId = filter.branchId;
  if (filter?.storeId) where.storeId = filter.storeId;
  if (filter?.customerId) where.customerId = filter.customerId;
  if (filter?.staffId) where.staffId = filter.staffId;
  if (filter?.status) where.status = filter.status;

  if (filter?.dateFrom || filter?.dateTo) {
    where.saleDate = {};
    if (filter.dateFrom) where.saleDate.gte = new Date(filter.dateFrom);
    if (filter.dateTo) where.saleDate.lte = new Date(filter.dateTo);
  }

  if (filter?.search) {
    where.OR = [
      { reference: { contains: filter.search, mode: "insensitive" } },
      { notes: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const take = filter?.limit ?? 20;
  const skip = ((filter?.page ?? 1) - 1) * take;

  const raw = await prisma.sale.findMany({
    where,
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { items: true } },
    },
    orderBy: { saleDate: "desc" },
    skip,
    take,
  });

  return raw.map((s) => ({
    ...s,
    saleDate: s.saleDate.toISOString(),
    grandTotal: Number(s.grandTotal),
  })) as unknown as SaleListItem[];
}

export async function updateSale(
  id: string,
  data: UpdateSaleSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    await prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.saleItem.deleteMany({ where: { saleId: id } });
      }

      const items = data.items ?? [];
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const discountTotal = data.discountTotal ?? 0;
      const taxTotal = data.taxTotal ?? 0;
      const grandTotal = subtotal - discountTotal + taxTotal;

      await tx.sale.update({
        where: { id },
        data: {
          branchId: data.branchId !== undefined ? (data.branchId || null) : undefined,
          storeId: data.storeId !== undefined ? (data.storeId || null) : undefined,
          customerId: data.customerId !== undefined ? (data.customerId || null) : undefined,
          staffId: data.staffId !== undefined ? (data.staffId || null) : undefined,
          saleDate: data.saleDate ? new Date(data.saleDate) : undefined,
          reference: data.reference !== undefined ? (data.reference || null) : undefined,
          status: data.status,
          subtotal: items.length > 0 ? subtotal : undefined,
          discountTotal,
          taxTotal,
          grandTotal: items.length > 0 ? grandTotal : undefined,
          notes: data.notes !== undefined ? (data.notes || null) : undefined,
          items: data.items
            ? {
                create: data.items.map((item) => ({
                  catalogItemId: item.catalogItemId,
                  variantId: item.variantId || null,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  discount: item.discount,
                  subtotal: item.subtotal,
                })),
              }
            : undefined,
        },
      });
    });

    return { success: true, message: "Sale updated successfully", data: { id } };
  } catch (error) {
    console.error("Update sale error:", error);
    return { success: false, message: "Failed to update sale" };
  }
}

export async function voidSale(id: string): Promise<ActionResponse> {
  try {
    const existing = await prisma.sale.findUnique({ where: { id } });
    if (!existing) return { success: false, message: "Sale not found" };
    if (existing.status === "cancelled") {
      return { success: false, message: "Sale is already cancelled" };
    }

    await prisma.sale.update({
      where: { id },
      data: { status: "cancelled" },
    });

    return { success: true, message: "Sale cancelled successfully" };
  } catch (error) {
    console.error("Void sale error:", error);
    return { success: false, message: "Failed to cancel sale" };
  }
}
