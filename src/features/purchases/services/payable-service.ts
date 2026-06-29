import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";

export interface SupplierOutstanding {
  supplierId: string;
  supplierName: string;
  totalOutstanding: number;
  purchaseCount: number;
}

export interface PayablesSummary {
  totalOutstanding: number;
  purchaseCount: number;
  supplierCount: number;
}

export async function getSupplierOutstandingBalance(supplierId: string): Promise<number> {
  const result = await prisma.purchase.aggregate({
    where: { supplierId, balanceDue: { gt: 0 } },
    _sum: { balanceDue: true },
  });
  return Number(result._sum.balanceDue ?? 0);
}

export async function getBusinessOutstandingSuppliers(businessId: string): Promise<SupplierOutstanding[]> {
  const purchases = await prisma.purchase.findMany({
    where: { businessId, balanceDue: { gt: 0 } },
    include: { supplier: { select: { id: true, name: true } } },
  });

  const bySupplier = new Map<string, { supplierId: string; supplierName: string; totalOutstanding: number; purchaseCount: number }>();

  for (const p of purchases) {
    const balance = Number(p.balanceDue);
    if (balance <= 0) continue;
    const key = p.supplierId;
    const existing = bySupplier.get(key);
    if (existing) {
      existing.totalOutstanding += balance;
      existing.purchaseCount++;
    } else {
      bySupplier.set(key, {
        supplierId: key,
        supplierName: p.supplier.name,
        totalOutstanding: balance,
        purchaseCount: 1,
      });
    }
  }

  return Array.from(bySupplier.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
}

export async function getBusinessPayablesSummary(businessId: string): Promise<PayablesSummary> {
  const purchases = await prisma.purchase.findMany({
    where: { businessId, balanceDue: { gt: 0 } },
    select: { balanceDue: true, supplierId: true },
  });

  let totalOutstanding = 0;
  const supplierSet = new Set<string>();

  for (const p of purchases) {
    totalOutstanding += Number(p.balanceDue);
    supplierSet.add(p.supplierId);
  }

  return {
    totalOutstanding,
    purchaseCount: purchases.length,
    supplierCount: supplierSet.size,
  };
}

export interface PurchaseOutstanding {
  id: string;
  reference: string;
  purchaseDate: string;
  dueDate: string | null;
  status: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
  isOverdue: boolean;
  supplierName: string;
}

export interface PayablesAgingBucket {
  label: string;
  minDays: number;
  maxDays: number | null;
  total: number;
  purchases: number;
}

export interface SupplierPayment {
  id: string;
  amount: number;
  paidAt: string;
  reference: string;
  supplierName: string;
  notes: string | null;
}

export async function getPayablesAging(businessId: string): Promise<PayablesAgingBucket[]> {
  const now = new Date();
  const purchases = await prisma.purchase.findMany({
    where: { businessId, balanceDue: { gt: 0 } },
  });

  const buckets: {
    current: { total: number; purchases: number };
    days1to30: { total: number; purchases: number };
    days31to60: { total: number; purchases: number };
    days61to90: { total: number; purchases: number };
    days90plus: { total: number; purchases: number };
  } = {
    current: { total: 0, purchases: 0 },
    days1to30: { total: 0, purchases: 0 },
    days31to60: { total: 0, purchases: 0 },
    days61to90: { total: 0, purchases: 0 },
    days90plus: { total: 0, purchases: 0 },
  };

  for (const p of purchases) {
    const balance = Number(p.balanceDue);
    if (balance <= 0) continue;

    if (!p.dueDate || p.dueDate >= now) {
      buckets.current.total += balance;
      buckets.current.purchases++;
    } else {
      const daysOverdue = Math.floor((now.getTime() - p.dueDate.getTime()) / 86400000);
      if (daysOverdue <= 30) {
        buckets.days1to30.total += balance;
        buckets.days1to30.purchases++;
      } else if (daysOverdue <= 60) {
        buckets.days31to60.total += balance;
        buckets.days31to60.purchases++;
      } else if (daysOverdue <= 90) {
        buckets.days61to90.total += balance;
        buckets.days61to90.purchases++;
      } else {
        buckets.days90plus.total += balance;
        buckets.days90plus.purchases++;
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

export async function getOutstandingPurchases(businessId: string): Promise<PurchaseOutstanding[]> {
  const now = new Date();
  const purchases = await prisma.purchase.findMany({
    where: { businessId, balanceDue: { gt: 0 } },
    include: { supplier: { select: { name: true } } },
    orderBy: { purchaseDate: "asc" },
  });

  return purchases.map((p) => ({
    id: p.id,
    reference: p.reference || `PUR-${p.id.slice(0, 8)}`,
    purchaseDate: p.purchaseDate.toISOString(),
    dueDate: p.dueDate?.toISOString() ?? null,
    status: p.status,
    total: Number(p.total),
    paidAmount: Number(p.paidAmount),
    balanceDue: Number(p.balanceDue),
    isOverdue: p.dueDate ? p.dueDate < now && Number(p.balanceDue) > 0 : false,
    supplierName: p.supplier.name,
  }));
}

export async function getOverduePurchases(businessId: string): Promise<PurchaseOutstanding[]> {
  const now = new Date();
  const purchases = await prisma.purchase.findMany({
    where: {
      businessId,
      balanceDue: { gt: 0 },
      dueDate: { lt: now },
    },
    include: { supplier: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
  });

  return purchases.map((p) => ({
    id: p.id,
    reference: p.reference || `PUR-${p.id.slice(0, 8)}`,
    purchaseDate: p.purchaseDate.toISOString(),
    dueDate: p.dueDate?.toISOString() ?? null,
    status: "overdue",
    total: Number(p.total),
    paidAmount: Number(p.paidAmount),
    balanceDue: Number(p.balanceDue),
    isOverdue: true,
    supplierName: p.supplier.name,
  }));
}

export async function getRecentSupplierPayments(
  businessId: string,
  limit = 10,
): Promise<SupplierPayment[]> {
  const payments = await prisma.payment.findMany({
    where: {
      businessId,
      purchaseId: { not: null },
      status: "completed",
    },
    orderBy: { paidAt: "desc" },
    take: limit,
  });

  const purchaseIds = payments.filter((p) => p.purchaseId).map((p) => p.purchaseId as string);
  const purchases = purchaseIds.length > 0
    ? await prisma.purchase.findMany({
        where: { id: { in: purchaseIds } },
        select: { id: true, reference: true, supplier: { select: { name: true } } },
      })
    : [];
  const purchaseMap = new Map(purchases.map((p) => [p.id, p]));

  return payments.map((p) => {
    const purchase = p.purchaseId ? purchaseMap.get(p.purchaseId) : undefined;
    return {
      id: p.id,
      amount: Number(p.amount),
      paidAt: p.paidAt.toISOString(),
      reference: purchase?.reference || `PUR-${(p.purchaseId ?? "").slice(0, 8)}`,
      supplierName: purchase?.supplier?.name ?? "Unknown",
      notes: p.notes,
    };
  });
}

export async function getEnhancedPayablesSummary(businessId: string): Promise<PayablesSummary & { totalOverdue: number; overdueCount: number }> {
  const now = new Date();
  const purchases = await prisma.purchase.findMany({
    where: { businessId, balanceDue: { gt: 0 } },
    select: { balanceDue: true, supplierId: true, dueDate: true },
  });

  let totalOutstanding = 0;
  let totalOverdue = 0;
  let overdueCount = 0;
  const supplierSet = new Set<string>();

  for (const p of purchases) {
    const balance = Number(p.balanceDue);
    totalOutstanding += balance;
    supplierSet.add(p.supplierId);
    if (p.dueDate && p.dueDate < now) {
      totalOverdue += balance;
      overdueCount++;
    }
  }

  return {
    totalOutstanding,
    totalOverdue,
    purchaseCount: purchases.length,
    supplierCount: supplierSet.size,
    overdueCount,
  };
}

export async function recordPurchasePayment(
  purchaseId: string,
  amount: number,
  businessId: string,
  workspaceId?: string,
  paymentMethodId?: string,
  createdById?: string,
  notes?: string,
): Promise<ActionResponse & { data?: { paymentId: string } }> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({
        where: { id: purchaseId },
        select: { id: true, total: true, paidAmount: true, balanceDue: true, businessId: true, supplierId: true },
      });

      if (!purchase) throw new Error("Purchase not found");
      if (purchase.businessId !== businessId) throw new Error("Purchase does not belong to this business");

      const newPaidAmount = Number(purchase.paidAmount) + amount;
      if (newPaidAmount > Number(purchase.total)) {
        throw new Error("Payment amount exceeds purchase balance");
      }
      const newBalanceDue = Number(purchase.total) - newPaidAmount;

      const payment = await tx.payment.create({
        data: {
          businessId,
          workspaceId: workspaceId || null,
          paymentMethodId: paymentMethodId || null,
          amount,
          status: "completed",
          purchaseId: purchase.id,
          paidAt: new Date(),
          notes: notes || `Payment against purchase`,
          createdById: createdById || null,
        },
      });

      const newStatus = newBalanceDue <= 0 ? "paid" : newPaidAmount > 0 ? "partial" : "unpaid";

      await tx.purchase.update({
        where: { id: purchaseId },
        data: { paidAmount: newPaidAmount, balanceDue: newBalanceDue, status: newStatus },
      });

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
