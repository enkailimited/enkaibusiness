import "server-only";

import { prisma } from "@/server/db";
import { searchService } from "@/server/search";
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

function recalcInvoiceStatus(total: number, paidAmount: number, dueDate: Date | null): string {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= total) return "paid";
  if (dueDate && dueDate < new Date()) return "overdue";
  return "partial";
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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { total: true, paidAmount: true, dueDate: true },
    });
    if (!invoice) return { success: false, message: "Invoice not found" };

    const existingPaid = Number(invoice.paidAmount);

    if (items) {
      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const total = subtotal + ((rest as { tax?: number }).tax ?? 0);
      updateData.subtotal = subtotal;
      updateData.total = total;
      updateData.balanceDue = total - existingPaid;

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

    const finalTotal = (updateData.total as number) ?? Number(invoice.total);
    const finalPaid = existingPaid;
    const finalDue = updateData.dueDate ? new Date(updateData.dueDate as string) : invoice.dueDate;
    updateData.balanceDue = finalTotal - finalPaid;
    updateData.status = recalcInvoiceStatus(finalTotal, finalPaid, finalDue);

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
  return {
    ...raw,
    subtotal: Number(raw.subtotal),
    tax: Number(raw.tax),
    total: Number(raw.total),
    paidAmount: Number(raw.paidAmount),
    balanceDue: Number(raw.balanceDue),
    invoiceDate: raw.invoiceDate instanceof Date ? raw.invoiceDate.toISOString() : raw.invoiceDate,
    dueDate: raw.dueDate instanceof Date ? raw.dueDate.toISOString() : raw.dueDate,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : raw.createdAt,
    updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw.updatedAt,
    items: (raw.items ?? []).map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
  } as InvoiceWithRelations;
}

export async function listInvoices(
  businessId: string,
  filter?: InvoiceFilterSchema,
  branchId?: string,
): Promise<InvoiceWithRelations[]> {
  const dateFilter: Record<string, Date> = {};
  if (filter?.dateFrom) dateFilter.gte = new Date(filter.dateFrom);
  if (filter?.dateTo) dateFilter.lte = new Date(filter.dateTo);
  const hasDateFilter = filter?.dateFrom || filter?.dateTo;

  const result = await searchService.invoices<any>({
    query: filter?.search,
    businessId,
    where: {
      ...(branchId ? { branchId } : {}),
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.customerId ? { customerId: filter.customerId } : {}),
      ...(hasDateFilter ? { invoiceDate: dateFilter } : {}),
    },
    include: {
      items: true,
      customer: { select: { id: true, firstName: true, lastName: true } },
      sale: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (result.items as any[]).map((inv) => ({
    ...inv,
    subtotal: Number(inv.subtotal),
    tax: Number(inv.tax),
    total: Number(inv.total),
    paidAmount: Number(inv.paidAmount),
    balanceDue: Number(inv.balanceDue),
    invoiceDate: inv.invoiceDate instanceof Date ? inv.invoiceDate.toISOString() : inv.invoiceDate,
    dueDate: inv.dueDate instanceof Date ? inv.dueDate.toISOString() : inv.dueDate,
    createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : inv.createdAt,
    updatedAt: inv.updatedAt instanceof Date ? inv.updatedAt.toISOString() : inv.updatedAt,
    items: (inv.items ?? []).map((item: any) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
  })) as InvoiceWithRelations[];
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
  businessId: string,
  workspaceId?: string,
  paymentMethodId?: string,
  customerId?: string,
  createdById?: string,
  notes?: string,
): Promise<ActionResponse> {
  try {
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id },
        select: { id: true, total: true, paidAmount: true, status: true, businessId: true, saleId: true, customerId: true, dueDate: true },
      });
      if (!invoice) throw new Error("Invoice not found");

      const newPaidAmount = Number(invoice.paidAmount) + amount;
      if (newPaidAmount > Number(invoice.total)) {
        throw new Error("Payment amount exceeds invoice balance");
      }

      await tx.payment.create({
        data: {
          businessId,
          workspaceId: workspaceId || null,
          paymentMethodId: paymentMethodId || null,
          customerId: customerId || invoice.customerId,
          amount,
          status: "completed",
          invoiceId: invoice.id,
          saleId: invoice.saleId || undefined,
          paidAt: new Date(),
          notes: notes || `Payment against invoice`,
          createdById: createdById || null,
        },
      });

      const balanceDue = Number(invoice.total) - newPaidAmount;
      const now = new Date();
      let status: string;
      if (balanceDue <= 0) status = "paid";
      else if (invoice.dueDate && invoice.dueDate < now) status = "overdue";
      else status = "partial";

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { paidAmount: newPaidAmount, balanceDue, status },
      });
    });

    return { success: true, message: "Payment recorded successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to record payment",
    };
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
