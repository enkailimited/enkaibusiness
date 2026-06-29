import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";

export interface ActivityInput {
  customerId: string;
  type: "call" | "email" | "sms" | "meeting" | "note" | "task" | "visit" | "complaint";
  subject: string;
  notes?: string;
  assignedToId?: string;
}

export async function logActivity(
  businessId: string,
  input: ActivityInput,
  createdById?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const activity = await prisma.customerActivity.create({
      data: {
        businessId,
        customerId: input.customerId,
        type: input.type,
        subject: input.subject,
        notes: input.notes || null,
        assignedToId: input.assignedToId || null,
        createdById: createdById || null,
      },
    });

    return { success: true, message: "Activity logged", data: { id: activity.id } };
  } catch (error) {
    console.error("Log activity error:", error);
    return { success: false, message: "Failed to log activity" };
  }
}

export async function getCustomerActivities(
  customerId: string,
  limit = 50,
) {
  return prisma.customerActivity.findMany({
    where: { customerId },
    include: {
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getBusinessActivities(
  businessId: string,
  filter?: {
    customerId?: string;
    type?: string;
    assignedToId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  },
) {
  const where: Record<string, unknown> = { businessId };

  if (filter?.customerId) where.customerId = filter.customerId;
  if (filter?.type) where.type = filter.type;
  if (filter?.assignedToId) where.assignedToId = filter.assignedToId;
  if (filter?.dateFrom || filter?.dateTo) {
    where.createdAt = {};
    if (filter.dateFrom) (where.createdAt as Record<string, unknown>).gte = filter.dateFrom;
    if (filter.dateTo) (where.createdAt as Record<string, unknown>).lte = filter.dateTo;
  }

  return prisma.customerActivity.findMany({
    where: where as Parameters<typeof prisma.customerActivity.findMany>[0]["where"],
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: filter?.limit || 100,
  });
}

export interface CustomerStatementLine {
  date: Date;
  type: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CustomerStatement {
  customerId: string;
  customerName: string;
  customerPhone: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  lines: CustomerStatementLine[];
}

export async function getCustomerStatement(
  customerId: string,
  dateFrom?: Date,
  dateTo?: Date,
): Promise<CustomerStatement> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { creditAccount: true },
  });

  if (!customer) throw new Error("Customer not found");

  const invoices = await prisma.invoice.findMany({
    where: {
      customerId,
      ...(dateFrom || dateTo ? {
        createdAt: {
          ...(dateFrom ? { gte: dateFrom } : {}),
          ...(dateTo ? { lte: dateTo } : {}),
        },
      } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  const payments = await prisma.payment.findMany({
    where: {
      customerId,
      ...(dateFrom || dateTo ? {
        createdAt: {
          ...(dateFrom ? { gte: dateFrom } : {}),
          ...(dateTo ? { lte: dateTo } : {}),
        },
      } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  const creditTxs = customer.creditAccount
    ? await prisma.customerCreditTransaction.findMany({
        where: {
          accountId: customer.creditAccount.id,
          ...(dateFrom || dateTo ? {
            createdAt: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          } : {}),
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const lines: CustomerStatementLine[] = [];
  let runningBalance = 0;

  const allEntries: Array<{ date: Date; sortKey: string; type: string; ref: string; desc: string; dr: number; cr: number }> = [];

  for (const inv of invoices) {
    allEntries.push({
      date: inv.createdAt,
      sortKey: `inv-${inv.createdAt.toISOString()}`,
      type: "Invoice",
      ref: inv.invoiceNumber,
      desc: `Invoice ${inv.invoiceNumber}`,
      dr: Number(inv.total),
      cr: 0,
    });
  }

  for (const pmt of payments) {
    allEntries.push({
      date: pmt.createdAt,
      sortKey: `pmt-${pmt.createdAt.toISOString()}`,
      type: "Payment",
      ref: pmt.id.slice(0, 8),
      desc: `Payment received`,
      dr: 0,
      cr: Number(pmt.amount),
    });
  }

  for (const tx of creditTxs) {
    const isDebit = tx.type === "credit_sale" || tx.type === "adjustment";
    allEntries.push({
      date: tx.createdAt,
      sortKey: `ctx-${tx.createdAt.toISOString()}`,
      type: tx.type === "credit_sale" ? "Credit Sale" : tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
      ref: tx.reference || tx.id.slice(0, 8),
      desc: tx.description || tx.type,
      dr: isDebit ? Number(tx.amount) : 0,
      cr: isDebit ? 0 : Number(tx.amount),
    });
  }

  allEntries.sort((a, b) => a.date.getTime() - b.date.getTime() || a.sortKey.localeCompare(b.sortKey));

  for (const entry of allEntries) {
    runningBalance += entry.dr - entry.cr;
    lines.push({
      date: entry.date,
      type: entry.type,
      reference: entry.ref,
      description: entry.desc,
      debit: entry.dr,
      credit: entry.cr,
      balance: runningBalance,
    });
  }

  const creditLimit = customer.creditAccount ? Number(customer.creditAccount.creditLimit) : 0;
  const currentBalance = customer.creditAccount ? Number(customer.creditAccount.currentBalance) : 0;

  return {
    customerId: customer.id,
    customerName: `${customer.firstName} ${customer.lastName || ""}`.trim(),
    customerPhone: customer.phone || "",
    creditLimit,
    currentBalance,
    availableCredit: Math.max(0, creditLimit - currentBalance),
    lines,
  };
}
