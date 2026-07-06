import "server-only";
import { prisma } from "@/server/db";
import type { KpiPeriod } from "@prisma/client";
import type {
  RevenueReport,
  CommissionReport,
  InstallationReport,
  CLVReport,
  ChurnReport,
  RetentionReport,
  ReferralReport,
  SalesPerformanceReport,
} from "../types";

function getPeriodDates(period: KpiPeriod, dateFrom?: string, dateTo?: string) {
  const now = new Date();
  let from: Date;
  let to: Date = dateTo ? new Date(dateTo) : now;

  if (dateFrom) {
    from = new Date(dateFrom);
  } else {
    from = new Date(now);
    switch (period) {
      case "DAILY":
        from.setDate(from.getDate() - 1);
        break;
      case "WEEKLY":
        from.setDate(from.getDate() - 7);
        break;
      case "MONTHLY":
        from.setMonth(from.getMonth() - 1);
        break;
      case "QUARTERLY":
        from.setMonth(from.getMonth() - 3);
        break;
      case "YEARLY":
        from.setFullYear(from.getFullYear() - 1);
        break;
    }
  }

  return { from, to };
}

export async function getRevenueReport(period: KpiPeriod = "MONTHLY", dateFrom?: string, dateTo?: string): Promise<RevenueReport> {
  const { from, to } = getPeriodDates(period, dateFrom, dateTo);

  const [snapshots, subscriptionPayments, totalCommissions] = await Promise.all([
    prisma.kpiSnapshot.findMany({
      where: {
        period,
        dateFrom: { gte: from, lte: to },
      },
      orderBy: { dateFrom: "asc" },
      select: {
        totalRevenue: true,
        recurringRevenue: true,
        installationRevenue: true,
        dateFrom: true,
        dateTo: true,
      },
    }),
    prisma.subscriptionPayment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: from, lte: to } },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { status: { not: "CANCELLED" }, createdAt: { gte: from, lte: to } },
    }),
  ]);

  const totalSubscriptionRevenue = Number(subscriptionPayments._sum.amount) || 0;
  const totalCommissionRevenue = Number(totalCommissions._sum.amount) || 0;

  const totalRevenue = snapshots.reduce((sum, s) => sum + Number(s.totalRevenue ?? 0), 0) || totalCommissionRevenue;
  const recurringRevenue = snapshots.reduce((sum, s) => sum + Number(s.recurringRevenue ?? 0), 0) || totalSubscriptionRevenue;
  const installationRevenue = snapshots.reduce((sum, s) => sum + Number(s.installationRevenue ?? 0), 0);

  return {
    period,
    dateFrom: from,
    dateTo: to,
    totalRevenue,
    recurringRevenue,
    installationRevenue,
    commissionRevenue: totalCommissionRevenue,
    subscriptionRevenue: totalSubscriptionRevenue,
    trend: snapshots.map((s) => ({
      date: s.dateFrom.toISOString().slice(0, 10),
      total: Number(s.totalRevenue ?? 0),
      recurring: Number(s.recurringRevenue ?? 0),
      installation: Number(s.installationRevenue ?? 0),
    })),
  };
}

export async function getCommissionReport(period: KpiPeriod = "MONTHLY", salesProfileId?: string): Promise<CommissionReport> {
  const { from, to } = getPeriodDates(period);
  const baseWhere: Record<string, unknown> = {
    createdAt: { gte: from, lte: to },
  };
  if (salesProfileId) baseWhere.salesProfileId = salesProfileId;

  const [totalEarned, totalPaid, totalPending, bySalesRep] = await Promise.all([
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { ...baseWhere, status: { not: "CANCELLED" } } as any,
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { ...baseWhere, status: "PAID" } as any,
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { ...baseWhere, status: "PENDING" } as any,
    }),
    getCommissionBySalesRep(from, to, salesProfileId),
  ]);

  return {
    period,
    dateFrom: from,
    dateTo: to,
    earned: Number(totalEarned._sum.amount) || 0,
    paid: Number(totalPaid._sum.amount) || 0,
    pending: Number(totalPending._sum.amount) || 0,
    bySalesRep,
  };
}

async function getCommissionBySalesRep(from: Date, to: Date, salesProfileId?: string) {
  const where: Record<string, unknown> = {
    createdAt: { gte: from, lte: to },
    status: { not: "CANCELLED" },
  };
  if (salesProfileId) where.salesProfileId = salesProfileId;

  const entries = await prisma.commissionLedger.groupBy({
    by: ["salesProfileId"],
    where: where as any,
    _sum: { amount: true },
    _count: true,
  });

  if (entries.length === 0) return [];

  const profiles = await prisma.salesProfile.findMany({
    where: { id: { in: entries.map((e) => e.salesProfileId) } },
    select: {
      id: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return entries.map((e) => {
    const profile = profileMap.get(e.salesProfileId);
    return {
      salesProfileId: e.salesProfileId,
      name: profile ? `${profile.user.firstName} ${profile.user.lastName}`.trim() : "Unknown",
      email: profile?.user.email ?? null,
      totalCommission: Number(e._sum.amount) || 0,
      entryCount: e._count,
    };
  }).sort((a, b) => b.totalCommission - a.totalCommission);
}

export async function getInstallationReport(period: KpiPeriod = "MONTHLY", installerId?: string): Promise<InstallationReport> {
  const { from, to } = getPeriodDates(period);
  const baseWhere: Record<string, unknown> = {
    createdAt: { gte: from, lte: to },
  };
  if (installerId) baseWhere.installerId = installerId;

  const [total, completed, pending, byInstaller] = await Promise.all([
    prisma.installationTicket.count({ where: baseWhere as any }),
    prisma.installationTicket.count({
      where: { ...baseWhere, status: "ACTIVATED" } as any,
    }),
    prisma.installationTicket.count({
      where: { ...baseWhere, status: { notIn: ["ACTIVATED", "DECLINED"] } } as any,
    }),
    getInstallationsByInstaller(from, to, installerId),
  ]);

  return {
    period,
    dateFrom: from,
    dateTo: to,
    total,
    completed,
    pending,
    byInstaller,
  };
}

async function getInstallationsByInstaller(from: Date, to: Date, installerId?: string) {
  const where: Record<string, unknown> = {
    createdAt: { gte: from, lte: to },
  };
  if (installerId) where.installerId = installerId;

  const tickets = await prisma.installationTicket.groupBy({
    by: ["installerId"],
    where: where as any,
    _count: true,
  });

  if (tickets.length === 0) return [];

  const installerIds = tickets.map((t) => t.installerId).filter(Boolean) as string[];
  const installers = await prisma.installer.findMany({
    where: { id: { in: installerIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  const installerMap = new Map(installers.map((i) => [i.id, i]));

  return tickets
    .filter((t) => t.installerId)
    .map((t) => {
      const inst = installerMap.get(t.installerId!);
      return {
        installerId: t.installerId!,
        name: inst ? `${inst.firstName} ${inst.lastName}` : "Unknown",
        totalJobs: t._count,
        avgCompletionTime: 0,
      };
    });
}

export async function getCLVReport(limit: number = 10): Promise<CLVReport> {
  const businesses = await prisma.business.findMany({
    where: { isActive: true },
    select: { id: true, name: true, createdAt: true },
    take: 100,
  });

  const clvEntries: CLVReport["topCustomers"] = [];
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

    const lifetimeValue =
      (Number(subscriptionPayments._sum?.amount) || 0) +
      (Number(salesTotal._sum?.grandTotal) || 0);

    const monthsSinceCreated = Math.max(
      1,
      Math.floor((Date.now() - business.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30.44)),
    );

    clvValues.push(lifetimeValue);
    clvEntries.push({
      businessId: business.id,
      businessName: business.name,
      lifetimeValue,
      averageMonthlyValue: Math.round(lifetimeValue / monthsSinceCreated),
      monthsActive: monthsSinceCreated,
    });
  }

  const sorted = [...clvValues].sort((a, b) => a - b);
  const totalEntries = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mid = Math.floor(totalEntries / 2);
  const median = totalEntries > 0
    ? totalEntries % 2 === 0
      ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
      : (sorted[mid] ?? 0)
    : 0;

  return {
    averageCLV: totalEntries > 0 ? Math.round(sum / totalEntries) : 0,
    medianCLV: Math.round(median),
    topCLV: sorted[sorted.length - 1] ?? 0,
    bottomCLV: sorted[0] ?? 0,
    totalBusinessesTracked: sorted.length,
    topCustomers: clvEntries
      .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
      .slice(0, limit),
  };
}

export async function getChurnReport(period: KpiPeriod = "MONTHLY", dateFrom?: string, dateTo?: string): Promise<ChurnReport> {
  const { from, to } = getPeriodDates(period, dateFrom, dateTo);

  const snapshots = await prisma.kpiSnapshot.findMany({
    where: {
      period,
      dateFrom: { gte: from, lte: to },
    },
    orderBy: { dateFrom: "asc" },
    select: {
      activeSubscriptions: true,
      expiredSubscriptions: true,
      activeCustomers: true,
      churnedCustomers: true,
      retainedCustomers: true,
      churnRate: true,
      retentionRate: true,
      dateFrom: true,
    },
  });

  const latest = snapshots[snapshots.length - 1];

  return {
    period,
    dateFrom: from,
    dateTo: to,
    churnRate: Number(latest?.churnRate ?? 0),
    retentionRate: Number(latest?.retentionRate ?? 0),
    activeSubscriptions: latest?.activeSubscriptions ?? 0,
    expiredSubscriptions: latest?.expiredSubscriptions ?? 0,
    activeCustomers: latest?.activeCustomers ?? 0,
    churnedCustomers: latest?.churnedCustomers ?? 0,
    retainedCustomers: latest?.retainedCustomers ?? 0,
    trend: snapshots.map((s) => ({
      date: s.dateFrom.toISOString().slice(0, 10),
      churnRate: Number(s.churnRate ?? 0),
      retentionRate: Number(s.retentionRate ?? 0),
    })),
  };
}

export async function getRetentionReport(period: KpiPeriod = "MONTHLY", dateFrom?: string, dateTo?: string): Promise<RetentionReport> {
  const { from, to } = getPeriodDates(period, dateFrom, dateTo);

  const snapshots = await prisma.kpiSnapshot.findMany({
    where: {
      period,
      dateFrom: { gte: from, lte: to },
    },
    orderBy: { dateFrom: "asc" },
    select: {
      renewalsSuccessful: true,
      renewalsFailed: true,
      retentionRate: true,
      dateFrom: true,
    },
  });

  const latest = snapshots[snapshots.length - 1];

  const commissionEntries = await prisma.commissionLedger.findMany({
    where: {
      type: "PERCENTAGE",
      description: { contains: "retention" },
      createdAt: { gte: from, lte: to },
    },
    select: { amount: true, createdAt: true },
  });

  const totalRetentionBonuses = commissionEntries.reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    period,
    dateFrom: from,
    dateTo: to,
    renewalsSuccessful: latest?.renewalsSuccessful ?? 0,
    renewalsFailed: latest?.renewalsFailed ?? 0,
    retentionRate: Number(latest?.retentionRate ?? 0),
    retentionBonusesAwarded: totalRetentionBonuses,
    retentionBonusCount: commissionEntries.length,
    trend: snapshots.map((s) => ({
      date: s.dateFrom.toISOString().slice(0, 10),
      retentionRate: Number(s.retentionRate ?? 0),
      renewalsSuccessful: s.renewalsSuccessful ?? 0,
      renewalsFailed: s.renewalsFailed ?? 0,
    })),
  };
}

export async function getReferralReport(period: KpiPeriod = "MONTHLY", limit: number = 10): Promise<ReferralReport> {
  const { from, to } = getPeriodDates(period);

  const referralEntries = await prisma.commissionLedger.findMany({
    where: {
      description: { contains: "referral" },
      status: { not: "CANCELLED" },
      createdAt: { gte: from, lte: to },
    },
    orderBy: { amount: "desc" },
    select: {
      id: true,
      amount: true,
      salesProfileId: true,
      description: true,
      createdAt: true,
    },
    take: limit,
  });

  const totalReferralCommissions = await prisma.commissionLedger.aggregate({
    _sum: { amount: true },
    where: {
      description: { contains: "referral" },
      status: { not: "CANCELLED" },
      createdAt: { gte: from, lte: to },
    },
  });

  const profileIds = [...new Set(referralEntries.map((e) => e.salesProfileId))];
  const profiles = profileIds.length > 0
    ? await prisma.salesProfile.findMany({
        where: { id: { in: profileIds } },
        select: {
          id: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      })
    : [];

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const aggregated: Record<string, { salesProfileId: string; name: string; totalCommission: number; entryCount: number }> = {};

  for (const e of referralEntries) {
    const profile = profileMap.get(e.salesProfileId);
    const name = profile ? `${profile.user.firstName} ${profile.user.lastName}`.trim() : "Unknown";
    const existing = aggregated[e.salesProfileId];
    if (existing) {
      existing.totalCommission += Number(e.amount);
      existing.entryCount += 1;
    } else {
      aggregated[e.salesProfileId] = {
        salesProfileId: e.salesProfileId,
        name,
        totalCommission: Number(e.amount),
        entryCount: 1,
      };
    }
  }

  return {
    period,
    dateFrom: from,
    dateTo: to,
    totalReferralCommissions: Number(totalReferralCommissions._sum.amount) || 0,
    totalReferralEntries: referralEntries.length,
    topReferrers: Object.values(aggregated).sort((a, b) => b.totalCommission - a.totalCommission).slice(0, limit),
  };
}

export async function getSalesPerformanceReport(period: KpiPeriod = "MONTHLY", limit: number = 20): Promise<SalesPerformanceReport> {
  const { from, to } = getPeriodDates(period);

  const profiles = await prisma.salesProfile.findMany({
    select: {
      id: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    take: limit,
  });

  const report = await Promise.all(
    profiles.map(async (profile) => {
      const [totalLeads, convertedLeads, commissionSum] = await Promise.all([
        prisma.lead.count({
          where: {
            assignedToId: profile.id,
            createdAt: { gte: from, lte: to },
          },
        }),
        prisma.lead.count({
          where: {
            assignedToId: profile.id,
            status: "CONVERTED",
            convertedAt: { gte: from, lte: to },
          },
        }),
        prisma.commissionLedger.aggregate({
          _sum: { amount: true },
          where: {
            salesProfileId: profile.id,
            status: { not: "CANCELLED" },
            createdAt: { gte: from, lte: to },
          },
        }),
      ]);

      return {
        salesProfileId: profile.id,
        name: `${profile.user.firstName} ${profile.user.lastName}`.trim(),
        email: profile.user.email,
        totalLeads,
        convertedLeads,
        conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
        totalRevenue: Number(commissionSum._sum.amount) || 0,
        installations: 0,
      };
    }),
  );

  return {
    period,
    dateFrom: from,
    dateTo: to,
    rankings: report.sort((a, b) => b.totalRevenue - a.totalRevenue),
  };
}
