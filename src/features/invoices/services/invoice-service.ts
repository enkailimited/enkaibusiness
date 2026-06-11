import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateInvoiceSchema, UpdateInvoiceSchema, InvoiceFilterSchema } from "../schemas";
import type { InvoiceWithItems, InvoiceWithRelations, InvoiceItemData } from "../types";
import { INVOICE_NUMBER_PREFIX } from "../constants";

function toItem(raw: Record<string, unknown>): InvoiceItemData {
  return {
    ...raw,
    quantity: Number((raw as { quantity: unknown }).quantity),
    unitPrice: Number((raw as { unitPrice: unknown }).unitPrice),
    subtotal: Number((raw as { subtotal: unknown }).subtotal),
  } as unknown as InvoiceItemData;
}

function toInvoiceWithItems(raw: Record<string, unknown>): InvoiceWithItems {
  return {
    ...raw,
    subtotal: Number((raw as { subtotal: unknown }).subtotal),
    tax: Number((raw as { tax: unknown }).tax),
    total: Number((raw as { total: unknown }).total),
    paidAmount: Number((raw as { paidAmount: unknown }).paidAmount),
    balanceDue: Number((raw as { balanceDue: unknown }).balanceDue),
    items: ((raw as { items: unknown }).items as Record<string, unknown>[]).map(toItem),
  } as unknown as InvoiceWithItems;
}

async function generateInvoiceNumber(businessId: string): Promise<string> {
  const count = await prisma.invoice.count({ where: { businessId } });
  const seq = String(count + 1).padStart(6, "0");
  return `${INVOICE_NUMBER_PREFIX}-${seq}`;
}

export async function createInvoice(
  data: CreateInvoiceSchema,
  businessId: string,
  workspaceId: string,
  branchId?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const { items, saleId, dueDate, notes } = data;
    const invoiceNumber = await generateInvoiceNumber(businessId);

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = 0;
    const total = subtotal + tax;

    const invoice = await prisma.invoice.create({
      data: {
        workspaceId,
        businessId,
        branchId: branchId || null,
        customerId: data.customerId,
        saleId: saleId || null,
        invoiceNumber,
        status: "draft",
        subtotal,
        tax,
        total,
        paidAmount: 0,
        balanceDue: total,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        items: {
          create: items.map((item) => ({
            catalogItemId: item.catalogItemId || null,
            description: item.description || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    return {
      success: true,
      message: "Invoice created successfully",
      data: { id: invoice.id },
    };
  } catch (error) {
    console.error("Create invoice error:", error);
    return { success: false, message: "Failed to create invoice" };
  }
}

export async function updateInvoice(
  id: string,
  data: UpdateInvoiceSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const { items, dueDate, notes, ...rest } = data;

    const updateData: Record<string, unknown> = { ...rest };
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (notes !== undefined) updateData.notes = notes || null;

    if (items) {
      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const total = subtotal + (rest as { tax?: number }).tax ?? 0;
      updateData.subtotal = subtotal;
      updateData.total = total;
      updateData.balanceDue = total;

      await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

      await prisma.invoiceItem.createMany({
        data: items.map((item) => ({
          invoiceId: id,
          catalogItemId: item.catalogItemId || null,
          description: item.description || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        })),
      });
    }

    await prisma.invoice.update({ where: { id }, data: updateData });

    return { success: true, message: "Invoice updated successfully", data: { id } };
  } catch (error) {
    console.error("Update invoice error:", error);
    return { success: false, message: "Failed to update invoice" };
  }
}

export async function getInvoice(id: string): Promise<InvoiceWithItems | null> {
  const raw = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!raw) return null;
  return toInvoiceWithItems(raw as unknown as Record<string, unknown>);
}

export async function getInvoiceWithRelations(id: string): Promise<InvoiceWithRelations | null> {
  const raw = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      customer: { select: { id: true, firstName: true, lastName: true } },
      sale: { select: { id: true } },
    },
  });
  if (!raw) return null;
  return raw as unknown as InvoiceWithRelations;
}

export async function listInvoices(
  businessId: string,
  filter?: InvoiceFilterSchema,
  branchId?: string,
): Promise<InvoiceWithRelations[]> {
  const where: Record<string, unknown> = { businessId };

  if (branchId) where.branchId = branchId;
  if (filter?.status) where.status = filter.status;
  if (filter?.customerId) where.customerId = filter.customerId;

  if (filter?.dateFrom || filter?.dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (filter.dateFrom) dateFilter.gte = new Date(filter.dateFrom);
    if (filter.dateTo) dateFilter.lte = new Date(filter.dateTo);
    where.invoiceDate = dateFilter;
  }

  if (filter?.search) {
    where.OR = [
      { invoiceNumber: { contains: filter.search, mode: "insensitive" } },
      { customer: { firstName: { contains: filter.search, mode: "insensitive" } } },
      { customer: { lastName: { contains: filter.search, mode: "insensitive" } } },
    ];
  }

  const raw = await prisma.invoice.findMany({
    where,
    include: {
      items: true,
      customer: { select: { id: true, firstName: true, lastName: true } },
      sale: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return raw as unknown as InvoiceWithRelations[];
}

export async function markAsSent(id: string): Promise<ActionResponse> {
  try {
    await prisma.invoice.update({
      where: { id },
      data: { status: "sent" },
    });
    return { success: true, message: "Invoice marked as sent" };
  } catch (error) {
    console.error("Mark as sent error:", error);
    return { success: false, message: "Failed to mark invoice as sent" };
  }
}

export async function recordPayment(
  id: string,
  amount: number,
): Promise<ActionResponse> {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return { success: false, message: "Invoice not found" };

    const paidAmount = Number(invoice.paidAmount) + amount;
    const total = Number(invoice.total);
    const balanceDue = total - paidAmount;

    let status = invoice.status;
    if (balanceDue <= 0) {
      status = "paid";
    } else if (paidAmount > 0) {
      status = "partial";
    }

    await prisma.invoice.update({
      where: { id },
      data: { paidAmount, balanceDue, status },
    });

    return { success: true, message: "Payment recorded successfully" };
  } catch (error) {
    console.error("Record payment error:", error);
    return { success: false, message: "Failed to record payment" };
  }
}

export async function markAsOverdue(id: string): Promise<ActionResponse> {
  try {
    await prisma.invoice.update({
      where: { id },
      data: { status: "overdue" },
    });
    return { success: true, message: "Invoice marked as overdue" };
  } catch (error) {
    console.error("Mark as overdue error:", error);
    return { success: false, message: "Failed to mark invoice as overdue" };
  }
}

export async function deleteInvoice(id: string): Promise<ActionResponse> {
  try {
    await prisma.invoice.delete({ where: { id } });
    return { success: true, message: "Invoice deleted successfully" };
  } catch (error) {
    console.error("Delete invoice error:", error);
    return { success: false, message: "Failed to delete invoice" };
  }
}
