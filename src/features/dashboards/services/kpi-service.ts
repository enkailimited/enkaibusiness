import "server-only";

import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import type { PlatformKPIs, BusinessKPIs } from "../types";

export async function getPlatformKPIs(period: "current" | "prev" = "current"): Promise<PlatformKPIs> {
  const now = new Date();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const createdAtFilter = period === "prev"
    ? { createdAt: { gte: prevMonthStart, lte: prevMonthEnd } }
    : {};
  const paidAtFilter = period === "prev"
    ? { createdAt: { gte: prevMonthStart, lte: prevMonthEnd } }
    : {};

  const [totalWorkspaces, totalBusinesses, totalUsers, revenueData, activeSubscriptions, pendingTickets] =
    await Promise.all([
      prisma.workspace.count({ where: { isActive: true, ...createdAtFilter } }),
      prisma.business.count({ where: { isActive: true, ...createdAtFilter } }),
      prisma.user.count({ where: { isActive: true, ...createdAtFilter } }),
      prisma.payment.aggregate({
        where: { status: "completed", ...paidAtFilter },
        _sum: { amount: true },
      }),
      prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
    ]);

  return {
    totalWorkspaces,
    totalBusinesses,
    totalUsers,
    totalRevenue: Number(revenueData._sum.amount) || 0,
    activeSubscriptions,
    pendingTickets,
  };
}

export async function getExtendedPlatformKPIs() {
  const [kpis, mrr, clvMetrics] = await Promise.all([
    getPlatformKPIs(),
    getMRR(),
    aggregateCLVMetrics(),
  ]);

  return {
    ...kpis,
    mrr: mrr,
    arr: mrr * 12,
    averageCLV: clvMetrics.averageCLV,
    medianCLV: clvMetrics.medianCLV,
    totalBusinessesTracked: clvMetrics.totalBusinessesTracked,
  };
}

async function getMRR() {
  const activeSubscriptions = await prisma.subscription.findMany({
    where: { status: "ACTIVE" },
    include: { plan: { select: { amount: true, interval: true } } },
  });

  let mrr = 0;
  for (const sub of activeSubscriptions) {
    const amount = Number(sub.plan.amount);
    switch (sub.plan.interval) {
      case "MONTHLY":
        mrr += amount;
        break;
      case "YEARLY":
        mrr += amount / 12;
        break;
      case "DAILY":
        mrr += amount * 30;
        break;
      case "WEEKLY":
        mrr += amount * 4.33;
        break;
    }
  }

  return Math.round(mrr * 100) / 100;
}

async function aggregateCLVMetrics() {
  const businesses = await prisma.business.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  if (businesses.length === 0) {
    return { averageCLV: 0, medianCLV: 0, totalBusinessesTracked: 0 };
  }

  const businessIds = businesses.map(b => b.id);

  const [subPayments, saleAggs] = await Promise.all([
    prisma.subscriptionPayment.findMany({
      where: { subscription: { businessId: { in: businessIds } } },
      select: { amount: true, subscription: { select: { businessId: true } } },
    }),
    prisma.sale.groupBy({
      by: ['businessId'],
      where: { businessId: { in: businessIds }, status: { not: "VOIDED" } },
      _sum: { grandTotal: true },
    }),
  ]);

  const subByBusiness = new Map<string, number>();
  for (const sp of subPayments) {
    const bid = sp.subscription.businessId;
    subByBusiness.set(bid, (subByBusiness.get(bid) ?? 0) + Number(sp.amount));
  }
  const saleByBusiness = new Map(saleAggs.map(s => [s.businessId, Number(s._sum.grandTotal ?? 0)]));

  const clvValues: number[] = [];

  for (const business of businesses) {
    const lifetimeValue =
      (subByBusiness.get(business.id) ?? 0) +
      (saleByBusiness.get(business.id) ?? 0);

    clvValues.push(lifetimeValue);
  }

  const sorted = [...clvValues].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const totalBusinesses = sorted.length;
  const mid = Math.floor(totalBusinesses / 2);
  const median = totalBusinesses > 0
    ? totalBusinesses % 2 === 0
      ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
      : (sorted[mid] ?? 0)
    : 0;

  return {
    averageCLV: totalBusinesses > 0 ? Math.round(sum / totalBusinesses) : 0,
    medianCLV: Math.round(median),
    totalBusinessesTracked: totalBusinesses,
  };
}

export async function getBusinessKPIs(
  businessId: string,
  period: "current" | "prev" = "current",
): Promise<BusinessKPIs> {
  const now = new Date();
  const offset = period === "prev" ? -7 : 0;

  const today = new Date(now);
  today.setDate(today.getDate() + offset);
  today.setHours(0, 0, 0, 0);

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const monthStart = period === "prev"
    ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  const monthEnd = period === "prev"
    ? new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    : now;

  const [
    todaySales,
    weeklySales,
    totalCustomers,
    lowStockCount,
    pendingOrders,
    monthlyExpenses,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        businessId,
        status: "completed",
        saleDate: { gte: today },
      },
      _sum: { grandTotal: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: {
        businessId,
        status: "completed",
        saleDate: { gte: weekStart },
      },
      _sum: { grandTotal: true },
    }),
    prisma.customer.count({ where: { businessId, isActive: true } }),
    prisma.inventoryBalance.count({
      where: {
        location: { businessId, isActive: true },
        quantityOnHand: { lte: prisma.inventoryBalance.fields.reorderPoint },
      },
    }),
    prisma.purchaseOrder.count({
      where: { businessId, status: { in: ["draft", "sent"] } },
    }),
    prisma.expense.aggregate({
      where: {
        businessId,
        status: { in: ["approved", "paid"] },
        expenseDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    todaySales: Number(todaySales._sum.grandTotal) || 0,
    weeklyRevenue: Number(weeklySales._sum.grandTotal) || 0,
    totalCustomers,
    lowStockCount,
    pendingOrders,
    monthlyExpenses: Number(monthlyExpenses._sum.amount) || 0,
  };
}
