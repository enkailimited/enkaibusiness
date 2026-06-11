import "server-only";

import { prisma } from "@/server/db";

export interface PlatformAnalytics {
  userGrowth: Array<{ month: string; count: number }>;
  businessGrowth: Array<{ month: string; count: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  topIndustries: Array<{ industry: string; count: number }>;
  totalVolume: {
    sales: number;
    businesses: number;
    users: number;
    workspaces: number;
  };
}

export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true },
  });

  const businesses = await prisma.business.findMany({
    where: { createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true },
  });

  const subscriptions = await prisma.subscriptionPayment.findMany({
    where: { createdAt: { gte: twelveMonthsAgo } },
    select: { amount: true, createdAt: true },
  });

  const modes = await prisma.businessMode.groupBy({
    by: ["industry"],
    _count: true,
  });

  const userGrowth = aggregateByMonth(users.map((u) => u.createdAt));
  const businessGrowth = aggregateByMonth(businesses.map((b) => b.createdAt));
  const revenueByMonth = aggregateRevenueByMonth(subscriptions);

  const [totalSales, totalBusinesses, totalUsers, totalWorkspaces] = await Promise.all([
    prisma.sale.aggregate({ _sum: { total: true } }),
    prisma.business.count(),
    prisma.user.count(),
    prisma.workspace.count(),
  ]);

  return {
    userGrowth,
    businessGrowth,
    revenueByMonth,
    topIndustries: modes.map((m) => ({ industry: m.industry, count: m._count })),
    totalVolume: {
      sales: Number(totalSales._sum.total || 0),
      businesses: totalBusinesses,
      users: totalUsers,
      workspaces: totalWorkspaces,
    },
  };
}

function aggregateByMonth(dates: Date[]): Array<{ month: string; count: number }> {
  const monthly: Record<string, number> = {};
  for (const date of dates) {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthly[key] = (monthly[key] || 0) + 1;
  }
  return Object.entries(monthly)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function aggregateRevenueByMonth(
  payments: Array<{ amount: number; createdAt: Date }>,
): Array<{ month: string; revenue: number }> {
  const monthly: Record<string, number> = {};
  for (const payment of payments) {
    const key = `${payment.createdAt.getFullYear()}-${String(payment.createdAt.getMonth() + 1).padStart(2, "0")}`;
    monthly[key] = (monthly[key] || 0) + Number(payment.amount);
  }
  return Object.entries(monthly)
    .map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
