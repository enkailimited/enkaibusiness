import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";

export interface CustomerOutstanding {
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  totalOutstanding: number;
  invoiceCount: number;
  oldestInvoiceDate: string | null;
  daysSinceOldest: number;
}

export interface InvoiceOutstanding {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  status: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
  isOverdue: boolean;
}

export interface ReceivablesSummary {
  totalOutstanding: number;
  totalOverdue: number;
  invoiceCount: number;
  overdueCount: number;
  customerCount: number;
  aging: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
  };
}

export interface AgingBucket {
  label: string;
  minDays: number;
  maxDays: number | null;
  total: number;
  invoices: number;
}

export async function getCustomerOutstandingInvoices(
  customerId: string,
): Promise<InvoiceOutstanding[]> {
  const now = new Date();
  const invoices = await prisma.invoice.findMany({
    where: {
      customerId,
      status: { in: ["unpaid", "partial", "overdue"] },
    },
    orderBy: { invoiceDate: "asc" },
  });

  return invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate.toISOString(),
    dueDate: inv.dueDate?.toISOString() ?? null,
    status: inv.status,
    total: Number(inv.total),
    paidAmount: Number(inv.paidAmount),
    balanceDue: Number(inv.balanceDue),
    isOverdue: inv.dueDate ? inv.dueDate < now && Number(inv.balanceDue) > 0 : false,
  }));
}

export async function getCustomerOutstandingBalance(
  customerId: string,
): Promise<number> {
  const result = await prisma.invoice.aggregate({
    where: {
      customerId,
      status: { in: ["unpaid", "partial", "overdue"] },
    },
    _sum: { balanceDue: true },
  });
  return Number(result._sum.balanceDue ?? 0);
}

export async function getBusinessOutstandingCustomers(
  businessId: string,
): Promise<CustomerOutstanding[]> {
  const now = new Date();
  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { in: ["unpaid", "partial", "overdue"] },
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
    },
    orderBy: { invoiceDate: "asc" },
  });

  const byCustomer = new Map<string, {
    customerId: string;
    customerName: string;
    customerPhone: string | null;
    totalOutstanding: number;
    invoiceCount: number;
    oldestInvoiceDate: Date | null;
  }>();

  for (const inv of invoices) {
    const balance = Number(inv.balanceDue);
    if (balance <= 0) continue;
    const key = inv.customerId;
    const existing = byCustomer.get(key);
    if (existing) {
      existing.totalOutstanding += balance;
      existing.invoiceCount++;
      if (existing.oldestInvoiceDate && inv.invoiceDate < existing.oldestInvoiceDate) {
        existing.oldestInvoiceDate = inv.invoiceDate;
      }
    } else {
      byCustomer.set(key, {
        customerId: key,
        customerName: `${inv.customer.firstName} ${inv.customer.lastName ?? ""}`.trim(),
        customerPhone: inv.customer.phone,
        totalOutstanding: balance,
        invoiceCount: 1,
        oldestInvoiceDate: inv.invoiceDate,
      });
    }
  }

  return Array.from(byCustomer.values())
    .map((c) => ({
      ...c,
      oldestInvoiceDate: c.oldestInvoiceDate?.toISOString() ?? null,
      daysSinceOldest: c.oldestInvoiceDate
        ? Math.floor((now.getTime() - c.oldestInvoiceDate.getTime()) / 86400000)
        : 0,
    }))
    .sort((a, b) => b.totalOutstanding - a.totalOutstanding);
}

export async function getBusinessReceivablesSummary(
  businessId: string,
): Promise<ReceivablesSummary> {
  const now = new Date();
  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { in: ["unpaid", "partial", "overdue"] },
    },
  });

  let totalOutstanding = 0;
  let totalOverdue = 0;
  let overdueCount = 0;
  const customerSet = new Set<string>();
  const aging = { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0 };

  for (const inv of invoices) {
    const balance = Number(inv.balanceDue);
    if (balance <= 0) continue;
    totalOutstanding += balance;
    customerSet.add(inv.customerId);

    const isOverdue = inv.dueDate && inv.dueDate < now;
    if (isOverdue) {
      totalOverdue += balance;
      overdueCount++;
      const daysOverdue = Math.floor((now.getTime() - inv.dueDate!.getTime()) / 86400000);
      if (daysOverdue <= 30) aging.days1to30 += balance;
      else if (daysOverdue <= 60) aging.days31to60 += balance;
      else if (daysOverdue <= 90) aging.days61to90 += balance;
      else aging.days90plus += balance;
    } else {
      aging.current += balance;
    }
  }

  return {
    totalOutstanding,
    totalOverdue,
    invoiceCount: invoices.length,
    overdueCount,
    customerCount: customerSet.size,
    aging,
  };
}

export async function getReceivablesAging(
  businessId: string,
): Promise<AgingBucket[]> {
  const now = new Date();
  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { in: ["unpaid", "partial", "overdue"] },
      balanceDue: { gt: 0 },
    },
  });

  const buckets: Record<string, { total: number; invoices: number }> = {
    current: { total: 0, invoices: 0 },
    days1to30: { total: 0, invoices: 0 },
    days31to60: { total: 0, invoices: 0 },
    days61to90: { total: 0, invoices: 0 },
    days90plus: { total: 0, invoices: 0 },
  };

  for (const inv of invoices) {
    const balance = Number(inv.balanceDue);
    if (balance <= 0) continue;

    if (!inv.dueDate || inv.dueDate >= now) {
      buckets.current.total += balance;
      buckets.current.invoices++;
    } else {
      const daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / 86400000);
      if (daysOverdue <= 30) {
        buckets.days1to30.total += balance;
        buckets.days1to30.invoices++;
      } else if (daysOverdue <= 60) {
        buckets.days31to60.total += balance;
        buckets.days31to60.invoices++;
      } else if (daysOverdue <= 90) {
        buckets.days61to90.total += balance;
        buckets.days61to90.invoices++;
      } else {
        buckets.days90plus.total += balance;
        buckets.days90plus.invoices++;
      }
    }
  }

  return [
    { label: "Current (0-30 days)", minDays: 0, maxDays: 30, ...buckets.current },
    { label: "31-60 days", minDays: 31, maxDays: 60, ...buckets.days1to30 },
    { label: "61-90 days", minDays: 61, maxDays: 90, ...buckets.days31to60 },
    { label: "91-120 days", minDays: 91, maxDays: 120, ...buckets.days61to90 },
    { label: "120+ days", minDays: 121, maxDays: null, ...buckets.days90plus },
  ];
}

async function recalculateInvoiceStatus(
  invoiceId: string,
  tx: typeof prisma,
): Promise<void> {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    select: { total: true, paidAmount: true, dueDate: true },
  });
  if (!invoice) return;

  const total = Number(invoice.total);
  const paidAmount = Number(invoice.paidAmount);
  const balanceDue = total - paidAmount;
  const now = new Date();

  let status: string;
  if (balanceDue <= 0) {
    status = "paid";
  } else if (invoice.dueDate && invoice.dueDate < now) {
    status = "overdue";
  } else if (paidAmount > 0) {
    status = "partial";
  } else {
    status = "unpaid";
  }

  await tx.invoice.update({
    where: { id: invoiceId },
    data: { paidAmount, balanceDue, status },
  });
}

export async function recordInvoicePayment(
  invoiceId: string,
  amount: number,
  businessId: string,
  workspaceId?: string,
  paymentMethodId?: string,
  customerId?: string,
  createdById?: string,
  notes?: string,
): Promise<ActionResponse & { data?: { paymentId: string } }> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        select: { id: true, total: true, paidAmount: true, status: true, businessId: true, saleId: true, customerId: true },
      });

      if (!invoice) throw new Error("Invoice not found");
      if (invoice.businessId !== businessId) throw new Error("Invoice does not belong to this business");

      const newPaidAmount = Number(invoice.paidAmount) + amount;
      if (newPaidAmount > Number(invoice.total)) {
        throw new Error("Payment amount exceeds invoice balance");
      }

      const payment = await tx.payment.create({
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

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { paidAmount: newPaidAmount },
      });

      await recalculateInvoiceStatus(invoiceId, tx);

      return payment;
    });

    return {
      success: true,
      message: "Payment recorded successfully",
      data: { paymentId: result.id },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to record payment",
    };
  }
}

export async function getOverdueInvoices(
  businessId: string,
): Promise<InvoiceOutstanding[]> {
  const now = new Date();
  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { in: ["unpaid", "partial", "overdue"] },
      dueDate: { lt: now },
      balanceDue: { gt: 0 },
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate.toISOString(),
    dueDate: inv.dueDate?.toISOString() ?? null,
    status: "overdue",
    total: Number(inv.total),
    paidAmount: Number(inv.paidAmount),
    balanceDue: Number(inv.balanceDue),
    isOverdue: true,
  }));
}

export async function markOverdueInvoices(businessId: string): Promise<number> {
  const now = new Date();
  const result = await prisma.invoice.updateMany({
    where: {
      businessId,
      status: { in: ["unpaid", "partial"] },
      dueDate: { lt: now },
      balanceDue: { gt: 0 },
    },
    data: { status: "overdue" },
  });
  return result.count;
}
