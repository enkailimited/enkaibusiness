import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateQuotationSchema, UpdateQuotationSchema, QuotationFilterSchema } from "../schemas";
import type { QuotationWithRelations, QuotationListItem } from "../types";

export async function createQuotation(
  data: CreateQuotationSchema,
  businessId: string,
  workspaceId: string,
  createdById?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const subtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = data.tax ?? 0;
    const total = subtotal + tax;

    const quotation = await prisma.$transaction(async (tx) => {
      const created = await tx.quotation.create({
        data: {
          workspaceId,
          businessId,
          branchId: data.branchId || null,
          customerId: data.customerId || null,
          staffId: data.staffId || null,
          quoteDate: data.quoteDate ? new Date(data.quoteDate) : new Date(),
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          status: data.status ?? "draft",
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
      message: "Quotation created successfully",
      data: { id: quotation.id },
    };
  } catch (error) {
    console.error("Create quotation error:", error);
    return { success: false, message: "Failed to create quotation" };
  }
}

export async function updateQuotation(
  id: string,
  data: UpdateQuotationSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    await prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      }

      const items = data.items ?? [];
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = data.tax ?? 0;
      const total = subtotal + tax;

      await tx.quotation.update({
        where: { id },
        data: {
          branchId: data.branchId !== undefined ? (data.branchId || null) : undefined,
          customerId: data.customerId !== undefined ? (data.customerId || null) : undefined,
          staffId: data.staffId !== undefined ? (data.staffId || null) : undefined,
          quoteDate: data.quoteDate ? new Date(data.quoteDate) : undefined,
          expiryDate: data.expiryDate !== undefined
            ? (data.expiryDate ? new Date(data.expiryDate) : null)
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
                  unitPrice: item.unitPrice,
                  discount: item.discount,
                  subtotal: item.subtotal,
                })),
              }
            : undefined,
        },
      });
    });

    return { success: true, message: "Quotation updated successfully", data: { id } };
  } catch (error) {
    console.error("Update quotation error:", error);
    return { success: false, message: "Failed to update quotation" };
  }
}

export async function getQuotation(id: string): Promise<QuotationWithRelations | null> {
  const raw = await prisma.quotation.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          catalogItem: {
            select: { id: true, name: true, sku: true },
          },
        },
      },
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!raw) return null;

  return {
    ...raw,
    quoteDate: raw.quoteDate.toISOString(),
    expiryDate: raw.expiryDate?.toISOString() ?? null,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    subtotal: Number(raw.subtotal),
    tax: Number(raw.tax),
    total: Number(raw.total),
    items: raw.items.map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      discount: Number(i.discount),
      subtotal: Number(i.subtotal),
    })),
  } as unknown as QuotationWithRelations;
}

export async function getBusinessQuotations(
  businessId: string,
  filter?: QuotationFilterSchema,
): Promise<QuotationListItem[]> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.customerId) where.customerId = filter.customerId;
  if (filter?.status) where.status = filter.status;

  if (filter?.dateFrom || filter?.dateTo) {
    where.quoteDate = {};
    if (filter.dateFrom) where.quoteDate.gte = new Date(filter.dateFrom);
    if (filter.dateTo) where.quoteDate.lte = new Date(filter.dateTo);
  }

  if (filter?.search) {
    where.OR = [
      { notes: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const take = filter?.limit ?? 20;
  const skip = ((filter?.page ?? 1) - 1) * take;

  const raw = await prisma.quotation.findMany({
    where,
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { items: true } },
    },
    orderBy: { quoteDate: "desc" },
    skip,
    take,
  });

  return raw.map((q) => ({
    ...q,
    quoteDate: q.quoteDate.toISOString(),
    expiryDate: q.expiryDate?.toISOString() ?? null,
    subtotal: Number(q.subtotal),
    tax: Number(q.tax),
    total: Number(q.total),
  })) as unknown as QuotationListItem[];
}

export async function deleteQuotation(id: string): Promise<ActionResponse> {
  try {
    await prisma.quotation.delete({ where: { id } });
    return { success: true, message: "Quotation deleted successfully" };
  } catch (error) {
    console.error("Delete quotation error:", error);
    return { success: false, message: "Failed to delete quotation" };
  }
}

async function changeQuotationStatus(
  id: string,
  newStatus: string,
  allowedCurrentStatuses: string[],
  successMessage: string,
): Promise<ActionResponse> {
  try {
    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) return { success: false, message: "Quotation not found" };

    if (!allowedCurrentStatuses.includes(existing.status)) {
      return {
        success: false,
        message: `Cannot change status from "${existing.status}" to "${newStatus}"`,
      };
    }

    await prisma.quotation.update({
      where: { id },
      data: { status: newStatus },
    });

    return { success: true, message: successMessage };
  } catch (error) {
    console.error("Change quotation status error:", error);
    return { success: false, message: `Failed to update quotation status to ${newStatus}` };
  }
}

export async function markQuotationAsSent(id: string): Promise<ActionResponse> {
  return changeQuotationStatus(id, "sent", ["draft"], "Quotation marked as sent");
}

export async function markQuotationAsAccepted(id: string): Promise<ActionResponse> {
  return changeQuotationStatus(id, "accepted", ["sent"], "Quotation accepted");
}

export async function markQuotationAsConverted(id: string): Promise<ActionResponse> {
  return changeQuotationStatus(id, "converted", ["accepted"], "Quotation converted");
}

export async function markQuotationAsRejected(id: string): Promise<ActionResponse> {
  return changeQuotationStatus(id, "rejected", ["sent", "draft"], "Quotation rejected");
}

export async function markQuotationAsExpired(id: string): Promise<ActionResponse> {
  return changeQuotationStatus(id, "expired", ["sent", "draft"], "Quotation expired");
}
