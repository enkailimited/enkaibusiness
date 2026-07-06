import "server-only";
import { prisma } from "@/server/db";
import type { PlatformDashboardData, RevenueTrendPoint, CommissionTrendPoint, SubscriptionTrendPoint } from "../types";

export async function getPlatformDashboardData(): Promise<PlatformDashboardData> {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    latestMonthly,
    monthSnapshots,
    newBusinesses,
    activeInstallers,
    pendingInstallations,
    totalLeads,
    convertedLeadsThisMonth,
    clvMetrics,
  ] = await Promise.all([
    prisma.kpiSnapshot.findFirst({
      where: { period: "MONTHLY" },
      orderBy: { computedAt: "desc" },
    }),
    prisma.kpiSnapshot.findMany({
      where: { period: "MONTHLY", computedAt: { gte: sixMonthsAgo } },
      orderBy: { computedAt: "asc" },
      take: 6,
    }),
    prisma.business.count({
      where: { createdAt: { gte: thisMonthStart } },
    }),
    prisma.installer.count({
      where: { status: { in: ["AVAILABLE", "TRAVELING", "BUSY"] } },
    }),
    prisma.installationTicket.count({
      where: { status: { notIn: ["ACTIVATED", "DECLINED"] as any } },
    }),
    prisma.lead.count({ where: { assignedToId: { not: null } } }),
    prisma.lead.count({
      where: { status: "CONVERTED", convertedAt: { gte: thisMonthStart } },
    }),
    getCLVAggregateMetrics(),
  ]);

  const mrr = Number(latestMonthly?.mrr ?? 0);
  const arr = mrr * 12;
  const activeSubscriptions = latestMonthly?.activeSubscriptions ?? 0;
  const commissionEarned = Number(latestMonthly?.totalCommissionEarned ?? 0);
  const commissionPaid = Number(latestMonthly?.totalCommissionPaid ?? 0);
  const churnRate = Number(latestMonthly?.churnRate ?? 0);
  const retentionRate = Number(latestMonthly?.retentionRate ?? 0);

  const commissionSnapshots = monthSnapshots;

  const subscriptionSnapshots = monthSnapshots;

  const revenueTrend: RevenueTrendPoint[] = monthSnapshots.map((s) => ({
    date: s.dateFrom.toISOString().slice(0, 7),
    revenue: Number(s.totalRevenue ?? 0),
    recurringRevenue: Number(s.recurringRevenue ?? 0),
    installationRevenue: Number(s.installationRevenue ?? 0),
  }));

  const commissionTrend: CommissionTrendPoint[] = commissionSnapshots.map((s) => ({
    date: s.dateFrom.toISOString().slice(0, 7),
    earned: Number(s.totalCommissionEarned ?? 0),
    paid: Number(s.totalCommissionPaid ?? 0),
    pending: Number(s.totalCommissionPending ?? 0),
  }));

  const subscriptionGrowth: SubscriptionTrendPoint[] = subscriptionSnapshots.map((s) => ({
    date: s.dateFrom.toISOString().slice(0, 7),
    active: s.activeSubscriptions ?? 0,
    new: s.newSubscriptions ?? 0,
    expired: s.expiredSubscriptions ?? 0,
  }));

  return {
    mrr,
    arr,
    totalRevenue: Number(latestMonthly?.totalRevenue ?? 0),
    activeSubscriptions,
    totalCommissionEarned: commissionEarned,
    totalCommissionPaid: commissionPaid,
    newBusinesses,
    activeInstallers,
    pendingInstallations,
    salesPipeline: {
      totalLeads,
      convertedThisMonth: convertedLeadsThisMonth,
    },
    customerLifetimeValue: {
      averageCLV: clvMetrics.averageCLV,
      medianCLV: clvMetrics.medianCLV,
      topCLV: clvMetrics.topCLV,
      bottomCLV: clvMetrics.bottomCLV,
      totalBusinessesTracked: clvMetrics.totalBusinessesTracked,
    },
    churnRate,
    retentionRate,
    revenueTrend,
    commissionTrend,
    subscriptionGrowth,
  };
}

async function getCLVAggregateMetrics() {
  const businesses = await prisma.business.findMany({
    where: { isActive: true },
    select: { id: true, createdAt: true },
  });

  if (businesses.length === 0) {
    return { averageCLV: 0, medianCLV: 0, topCLV: 0, bottomCLV: 0, totalBusinessesTracked: 0 };
  }

  const clvValues: number[] = [];

  for (const business of businesses) {
    const [subscriptionPayments, salesTotal] = await Promise.all([
      prisma.subscriptionPayment.aggregate({
        _sum: { amount: true },
        where: { subscription: { businessId: business.id } },
      }),
      prisma.sale.aggregate({
        _sum: { grandTotal: true },
        where: { businessId: business.id, status: { not: "VOIDED" } },
      }),
    ]);

    const totalSub = Number(subscriptionPayments._sum?.amount) || 0;
    const totalSales = Number(salesTotal._sum?.grandTotal) || 0;
    clvValues.push(totalSub + totalSales);
  }

  const sorted = [...clvValues].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : (sorted[mid] ?? 0);

  return {
    averageCLV: sorted.length > 0 ? sum / sorted.length : 0,
    medianCLV: median,
    topCLV: sorted[sorted.length - 1] ?? 0,
    bottomCLV: sorted[0] ?? 0,
    totalBusinessesTracked: sorted.length,
  };
}
