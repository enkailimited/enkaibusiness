import "server-only";

import { prisma } from "@/server/db";

export async function getRevenueMetrics() {
  const totalRevenue = await prisma.subscriptionPayment.aggregate({
    _sum: { amount: true },
  });

  const pendingPayments = await prisma.subscriptionPayment.count({
    where: { subscription: { status: { not: "CANCELLED" } } },
  });

  return {
    totalSubscriptionRevenue: Number(totalRevenue._sum.amount) || 0,
    pendingPayments,
  };
}

export async function getCommissionExpenses() {
  const [totalPaid, totalPending] = await Promise.all([
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { status: "PAID" },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { status: "PENDING" },
    }),
  ]);

  return {
    totalCommissionsPaid: Number(totalPaid._sum.amount) || 0,
    totalCommissionsPending: Number(totalPending._sum.amount) || 0,
  };
}

export async function getRevenueByPeriod(
  startDate: Date,
  endDate?: Date,
) {
  const where: Record<string, unknown> = {
    paidAt: { gte: startDate },
  };

  if (endDate) {
    (where.paidAt as Record<string, unknown>).lte = endDate;
  }

  const payments = await prisma.subscriptionPayment.findMany({
    where,
    select: { amount: true, paidAt: true },
    orderBy: { paidAt: "asc" },
  });

  const byDay: Record<string, number> = {};
  const byWeek: Record<string, number> = {};
  const byMonth: Record<string, number> = {};

  for (const p of payments) {
    if (!p.paidAt) continue;

    const dayKey = p.paidAt.toISOString().substring(0, 10);
    byDay[dayKey] = (byDay[dayKey] || 0) + Number(p.amount);

    const weekStart = new Date(p.paidAt);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().substring(0, 10);
    byWeek[weekKey] = (byWeek[weekKey] || 0) + Number(p.amount);

    const monthKey = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
    byMonth[monthKey] = (byMonth[monthKey] || 0) + Number(p.amount);
  }

  return {
    byDay: Object.entries(byDay).map(([date, amount]) => ({ date, amount })),
    byWeek: Object.entries(byWeek).map(([date, amount]) => ({ date, amount })),
    byMonth: Object.entries(byMonth).map(([date, amount]) => ({ date, amount })),
  };
}

export async function getFinancialSummary() {
  const [revenue, expenses, activeSubscriptions] = await Promise.all([
    prisma.subscriptionPayment.aggregate({
      _sum: { amount: true },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { status: "PAID" },
    }),
    prisma.subscription.count({
      where: { status: "ACTIVE" },
    }),
  ]);

  const totalRevenue = Number(revenue._sum.amount) || 0;
  const totalExpenses = Number(expenses._sum.amount) || 0;

  return {
    totalRevenue,
    totalExpenses,
    net: totalRevenue - totalExpenses,
    activeSubscriptions,
  };
}
