import "server-only";
import { prisma } from "@/server/db";
import type { SalesDashboardData } from "../types";

export async function getSalesDashboardData(salesProfileId: string): Promise<SalesDashboardData> {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const profile = await prisma.salesProfile.findUnique({
    where: { id: salesProfileId },
    select: { id: true, userId: true },
  });
  if (!profile) throw new Error("Sales profile not found");

  const [
    activeCustomers,
    thisMonthCommission,
    lifetimeIncome,
    installationsThisMonth,
    currentTarget,
    commissionBreakdown,
    leadsByStatus,
    recentEntries,
    monthlyCommissionHistory,
    recurringConfigs,
    topCustomers,
    currentProgress,
  ] = await Promise.all([
    prisma.lead.count({
      where: { assignedToId: salesProfileId, status: "CONVERTED" },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: {
        salesProfileId,
        status: { not: "CANCELLED" },
        createdAt: { gte: thisMonthStart },
      },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: {
        salesProfileId,
        status: "PAID",
      },
    }),
    prisma.installationTicket.count({
      where: {
        installerId: { not: null },
        activatedAt: { gte: thisMonthStart },
        status: "ACTIVATED",
      },
    }),
    prisma.salesTarget.findFirst({
      where: {
        salesProfileId,
        period: "MONTHLY",
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      },
    }),
    getCommissionBreakdown(salesProfileId),
    getLeadsByStatus(salesProfileId),
    prisma.commissionLedger.findMany({
      where: { salesProfileId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        payout: { select: { paidAt: true } },
      },
    }),
    getMonthlyCommissionHistory(salesProfileId, sixMonthsAgo),
    prisma.recurringCommissionConfig.findMany({
      where: { salesProfileId, isActive: true },
      include: {
        subscription: {
          include: {
            plan: { select: { id: true, name: true, amount: true, interval: true } },
            business: { select: { id: true, name: true } },
          },
        },
      },
    }),
    getTopCustomersByCLV(salesProfileId, 5),
    getCurrentProgress(salesProfileId),
  ]);

  const monthlyEarned = Number(thisMonthCommission._sum.amount ?? 0);
  const totalPaidLifetime = Number(lifetimeIncome._sum.amount ?? 0);

  const projectedIncome = recurringConfigs.reduce((sum, cfg) => {
    const planAmount = Number(cfg.subscription.plan.amount);
    const pct = Number(cfg.percentage);
    return sum + (planAmount * pct) / 100;
  }, 0);

  return {
    activeCustomers,
    recurringIncome: monthlyEarned,
    projectedIncome,
    lifetimeIncome: totalPaidLifetime,
    installationsThisMonth,
    currentTarget: currentTarget
      ? {
          id: currentTarget.id,
          period: currentTarget.period,
          year: currentTarget.year,
          month: currentTarget.month,
          leadsTarget: currentTarget.leadsTarget,
          conversionsTarget: currentTarget.conversionsTarget,
          revenueTarget: Number(currentTarget.revenueTarget ?? 0),
          recurringRevenueTarget: Number(currentTarget.recurringRevenueTarget ?? 0),
          installationsTarget: currentTarget.installationsTarget,
          achievedLeads: currentProgress.achievedLeads,
          achievedConversions: currentProgress.achievedConversions,
          achievedRevenue: currentProgress.achievedRevenue,
        }
      : null,
    progress: {
      leads: currentTarget?.leadsTarget
        ? Math.round((currentProgress.achievedLeads / currentTarget.leadsTarget) * 100)
        : 0,
      conversions: currentTarget?.conversionsTarget
        ? Math.round((currentProgress.achievedConversions / currentTarget.conversionsTarget) * 100)
        : 0,
      revenue: currentTarget?.revenueTarget && Number(currentTarget.revenueTarget) > 0
        ? Math.round((currentProgress.achievedRevenue / Number(currentTarget.revenueTarget)) * 100)
        : 0,
    },
    commissionBreakdown,
    leadsPipeline: leadsByStatus,
    recentCommissionEntries: recentEntries.map((e) => ({
      id: e.id,
      amount: Number(e.amount),
      type: e.type,
      description: e.description,
      status: e.status,
      paidAt: e.payout?.paidAt ?? e.paidAt,
      createdAt: e.createdAt,
    })),
    monthlyCommissionTrend: monthlyCommissionHistory,
    recurringCommissions: recurringConfigs.map((cfg) => ({
      id: cfg.id,
      percentage: Number(cfg.percentage),
      totalPaid: Number(cfg.totalPaid),
      paidCount: cfg.paidCount,
      lastPaidDate: cfg.lastPaidDate,
      planName: cfg.subscription.plan.name,
      planAmount: Number(cfg.subscription.plan.amount),
      planInterval: cfg.subscription.plan.interval,
      businessName: cfg.subscription.business.name,
    })),
    topCustomersByCLV: topCustomers,
  };
}

async function getCommissionBreakdown(salesProfileId: string) {
  const [earned, paid, pending, approved] = await Promise.all([
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { salesProfileId, status: { not: "CANCELLED" } },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { salesProfileId, status: "PAID" },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { salesProfileId, status: "PENDING" },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { salesProfileId, status: "APPROVED" },
    }),
  ]);

  return {
    earned: Number(earned._sum.amount) || 0,
    paid: Number(paid._sum.amount) || 0,
    pending: Number(pending._sum.amount) || 0,
    approved: Number(approved._sum.amount) || 0,
  };
}

async function getLeadsByStatus(salesProfileId: string) {
  const statuses = ["NEW", "CONTACTED", "INTERESTED", "DEMO", "NEGOTIATION", "CONVERTED", "LOST"] as const;
  const counts = await Promise.all(
    statuses.map((status) =>
      prisma.lead.count({ where: { assignedToId: salesProfileId, status } })
    ),
  );
  return statuses.map((status, i) => ({ status, count: counts[i] ?? 0 }));
}

async function getMonthlyCommissionHistory(salesProfileId: string, since: Date) {
  const snapshots = await prisma.kpiSnapshot.findMany({
    where: { period: "MONTHLY", computedAt: { gte: since } },
    orderBy: { computedAt: "asc" },
    take: 6,
  });

  const entries = await prisma.commissionLedger.groupBy({
    by: ["createdAt"],
    where: {
      salesProfileId,
      status: { not: "CANCELLED" },
      createdAt: { gte: since },
    },
    _sum: { amount: true },
  });

  const monthBuckets: Record<string, number> = {};
  for (const snap of snapshots) {
    const key = snap.dateFrom.toISOString().slice(0, 7);
    monthBuckets[key] = 0;
  }
  for (const entry of entries) {
    const key = new Date(entry.createdAt).toISOString().slice(0, 7);
    if (monthBuckets[key] !== undefined) {
      monthBuckets[key] += Number(entry._sum.amount) || 0;
    }
  }

  return Object.entries(monthBuckets).map(([month, amount]) => ({
    month,
    amount,
  }));
}

async function getTopCustomersByCLV(salesProfileId: string, limit: number) {
  const convertedLeads = await prisma.lead.findMany({
    where: { assignedToId: salesProfileId, status: "CONVERTED" },
    select: { id: true, businessName: true, convertedToUserId: true },
  });

  if (convertedLeads.length === 0) return [];

  const businesses = await prisma.business.findMany({
    where: {
      createdById: {
        in: convertedLeads.map((l) => l.convertedToUserId).filter(Boolean) as string[],
      },
    },
    select: { id: true, name: true, createdById: true },
  });

  const businessByCreator = new Map(businesses.map((b) => [b.createdById, b]));

  const clvEntries: Array<{ businessName: string; clv: number }> = [];

  for (const lead of convertedLeads) {
    if (!lead.convertedToUserId) continue;
    const business = businessByCreator.get(lead.convertedToUserId);
    if (!business) continue;

    const payments = await prisma.subscriptionPayment.aggregate({
      _sum: { amount: true },
      where: { subscription: { businessId: business.id } },
    });
    const clv = Number(payments._sum?.amount) || 0;
    clvEntries.push({ businessName: lead.businessName ?? business.name, clv });
  }

  return clvEntries
    .sort((a, b) => b.clv - a.clv)
    .slice(0, limit);
}

async function getCurrentProgress(salesProfileId: string) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [achievedLeads, achievedConversions, commissionSum] = await Promise.all([
    prisma.lead.count({
      where: {
        assignedToId: salesProfileId,
        createdAt: { gte: thisMonthStart, lt: nextMonthStart },
      },
    }),
    prisma.lead.count({
      where: {
        assignedToId: salesProfileId,
        status: "CONVERTED",
        convertedAt: { gte: thisMonthStart, lt: nextMonthStart },
      },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: {
        salesProfileId,
        status: { not: "CANCELLED" },
        createdAt: { gte: thisMonthStart, lt: nextMonthStart },
      },
    }),
  ]);

  return {
    achievedLeads,
    achievedConversions,
    achievedRevenue: Number(commissionSum._sum.amount) || 0,
  };
}
