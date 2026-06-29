import "server-only";

import { prisma } from "@/server/db";
import type { CustomerStatement, SupplierStatement, StatementLine } from "../types";

export async function getCustomerStatement(
  customerId: string,
  businessId: string,
  from: Date,
  to: Date,
): Promise<CustomerStatement> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId, businessId },
    select: { firstName: true, lastName: true },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      customerId,
      businessId,
      status: { not: "cancelled" },
    },
    select: {
      id: true,
      invoiceDate: true,
      invoiceNumber: true,
      total: true,
      paidAmount: true,
      status: true,
    },
    orderBy: { invoiceDate: "asc" },
  });

  const payments = await prisma.payment.findMany({
    where: {
      customerId,
      businessId,
      status: "completed",
    },
    select: {
      id: true,
      paidAt: true,
      reference: true,
      amount: true,
      notes: true,
    },
    orderBy: { paidAt: "asc" },
  });

  const openingInvoices = invoices.filter((inv) => inv.invoiceDate < from);
  const openingPayments = payments.filter((p) => p.paidAt < from);
  const openingBalance = openingInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)
    - openingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const periodInvoices = invoices.filter(
    (inv) => inv.invoiceDate >= from && inv.invoiceDate <= to,
  );
  const periodPayments = payments.filter(
    (p) => p.paidAt >= from && p.paidAt <= to,
  );

  const lines: StatementLine[] = [];
  let runningBalance = openingBalance;

  let i = 0;
  let j = 0;

  while (i < periodInvoices.length || j < periodPayments.length) {
    const inv = periodInvoices[i];
    const pay = periodPayments[j];

    if (inv && (!pay || inv.invoiceDate <= pay.paidAt)) {
      const debit = Number(inv.total);
      runningBalance += debit;
      lines.push({
        date: inv.invoiceDate.toISOString(),
        reference: inv.invoiceNumber,
        description: `Invoice ${inv.invoiceNumber}`,
        debit,
        credit: 0,
        balance: runningBalance,
      });
      i++;
    } else if (pay) {
      const credit = Number(pay.amount);
      runningBalance -= credit;
      lines.push({
        date: pay.paidAt.toISOString(),
        reference: pay.reference || `PAY-${pay.id.slice(0, 8)}`,
        description: pay.notes || "Payment received",
        debit: 0,
        credit,
        balance: runningBalance,
      });
      j++;
    }
  }

  const closingBalance = openingBalance
    + periodInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)
    - periodPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(" ");

  return {
    customerId,
    customerName,
    businessId,
    dateRange: { from, to },
    openingBalance,
    lines,
    closingBalance,
  };
}

export async function getSupplierStatement(
  supplierId: string,
  businessId: string,
  from: Date,
  to: Date,
): Promise<SupplierStatement> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId, businessId },
    select: { name: true },
  });

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  const purchases = await prisma.purchase.findMany({
    where: {
      supplierId,
      businessId,
      status: { not: "cancelled" },
    },
    select: {
      id: true,
      purchaseDate: true,
      reference: true,
      total: true,
    },
    orderBy: { purchaseDate: "asc" },
  });

  const purchaseIds = purchases.map((p) => p.id);

  const payments = await prisma.payment.findMany({
    where: {
      purchaseId: { in: purchaseIds },
      businessId,
      status: "completed",
    },
    select: {
      id: true,
      paidAt: true,
      reference: true,
      amount: true,
      notes: true,
      purchaseId: true,
    },
    orderBy: { paidAt: "asc" },
  });

  const openingPurchases = purchases.filter((p) => p.purchaseDate < from);
  const openingPayments = payments.filter((p) => p.paidAt < from);
  const openingBalance = openingPurchases.reduce((sum, p) => sum + Number(p.total), 0)
    - openingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const periodPurchases = purchases.filter(
    (p) => p.purchaseDate >= from && p.purchaseDate <= to,
  );
  const periodPayments = payments.filter(
    (p) => p.paidAt >= from && p.paidAt <= to,
  );

  const lines: StatementLine[] = [];
  let runningBalance = openingBalance;

  let i = 0;
  let j = 0;

  while (i < periodPurchases.length || j < periodPayments.length) {
    const pur = periodPurchases[i];
    const pay = periodPayments[j];

    if (pur && (!pay || pur.purchaseDate <= pay.paidAt)) {
      const credit = Number(pur.total);
      runningBalance += credit;
      lines.push({
        date: pur.purchaseDate.toISOString(),
        reference: pur.reference || `PUR-${pur.id.slice(0, 8)}`,
        description: `Purchase ${pur.reference || pur.id.slice(0, 8)}`,
        debit: 0,
        credit,
        balance: runningBalance,
      });
      i++;
    } else if (pay) {
      const debit = Number(pay.amount);
      runningBalance -= debit;
      lines.push({
        date: pay.paidAt.toISOString(),
        reference: pay.reference || `PAY-${pay.id.slice(0, 8)}`,
        description: pay.notes || "Payment to supplier",
        debit,
        credit: 0,
        balance: runningBalance,
      });
      j++;
    }
  }

  const closingBalance = openingBalance
    + periodPurchases.reduce((sum, p) => sum + Number(p.total), 0)
    - periodPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    supplierId,
    supplierName: supplier.name,
    businessId,
    dateRange: { from, to },
    openingBalance,
    lines,
    closingBalance,
  };
}
