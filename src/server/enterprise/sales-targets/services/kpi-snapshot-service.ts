import "server-only";
import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { KpiPeriod } from "@prisma/client";

export async function computeAndStoreSnapshot(period: KpiPeriod, dateFrom?: Date, dateTo?: Date) {
  const now = new Date();
  const from = dateFrom ?? getPeriodStart(period, now);
  const to = dateTo ?? getPeriodEnd(period, now);

  const existing = await prisma.kpiSnapshot.findFirst({
    where: { period, dateFrom: from, dateTo: to },
  });
  if (existing) return existing;

  const [
    activeSubs,
    newSubs,
    expiredSubs,
    commissionEarned,
    commissionPaid,
    commissionPending,
    totalLeads,
    newLeads,
    convertedLeads,
    lostLeads,
    activeBusinesses,
    churnedBusinesses,
    installationsCompleted,
    installationsPending,
  ] = await Promise.all([
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "ACTIVE", createdAt: { gte: from, lte: to } } }),
    prisma.subscription.count({ where: { status: "EXPIRED", updatedAt: { gte: from, lte: to } } }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { status: { not: "CANCELLED" }, createdAt: { gte: from, lte: to } },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", createdAt: { gte: from, lte: to } },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { status: "PENDING", createdAt: { gte: from, lte: to } },
    }),
    prisma.lead.count({ where: { assignedToId: { not: null } } }),
    prisma.lead.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.lead.count({ where: { status: "CONVERTED", convertedAt: { gte: from, lte: to } } }),
    prisma.lead.count({ where: { status: "LOST", updatedAt: { gte: from, lte: to } } }),
    prisma.business.count({ where: { isActive: true } }),
    prisma.business.count({ where: { isActive: false, updatedAt: { gte: from, lte: to } } }),
    prisma.installationTicket.count({ where: { status: "ACTIVATED", activatedAt: { gte: from, lte: to } } }),
    prisma.installationTicket.count({ where: { status: { notIn: ["ACTIVATED", "DECLINED"] } } }),
  ]);

  const totalCommissionEarnedVal = Number(commissionEarned._sum.amount) || 0;
  const totalCommissionPaidVal = Number(commissionPaid._sum.amount) || 0;
  const totalCommissionPendingVal = Number(commissionPending._sum.amount) || 0;

  const activeSubscriptions = await prisma.subscription.findMany({
    where: { status: "ACTIVE" },
    include: { plan: { select: { amount: true } } },
  });
  const mrrValue = activeSubscriptions.reduce((sum, sub) => sum + Number(sub.plan.amount), 0);
  const arrValue = mrrValue * 12;

  const churnRate = activeSubs + expiredSubs > 0
    ? new Prisma.Decimal(((expiredSubs / (activeSubs + expiredSubs)) * 100).toFixed(2))
    : new Prisma.Decimal(0);

  const retentionRate = activeSubs + expiredSubs > 0
    ? new Prisma.Decimal(((activeSubs / (activeSubs + expiredSubs)) * 100).toFixed(2))
    : new Prisma.Decimal(100);

  const conversionRate = newLeads > 0
    ? new Prisma.Decimal(((convertedLeads / newLeads) * 100).toFixed(2))
    : new Prisma.Decimal(0);

  const snapshot = await prisma.kpiSnapshot.create({
    data: {
      period,
      dateFrom: from,
      dateTo: to,
      totalRevenue: new Prisma.Decimal(totalCommissionEarnedVal),
      recurringRevenue: new Prisma.Decimal(0),
      installationRevenue: new Prisma.Decimal(0),
      activeSubscriptions: activeSubs,
      newSubscriptions: newSubs,
      expiredSubscriptions: expiredSubs,
      totalCommissionEarned: new Prisma.Decimal(totalCommissionEarnedVal),
      totalCommissionPaid: new Prisma.Decimal(totalCommissionPaidVal),
      totalCommissionPending: new Prisma.Decimal(totalCommissionPendingVal),
      totalLeads,
      newLeads,
      convertedLeads,
      lostLeads,
      activeCustomers: activeBusinesses,
      churnedCustomers: churnedBusinesses,
      retainedCustomers: activeBusinesses - churnedBusinesses,
      installationsCompleted,
      installationsPending,
      renewalsSuccessful: newSubs,
      renewalsFailed: expiredSubs,
      mrr: new Prisma.Decimal(mrrValue),
      arr: new Prisma.Decimal(arrValue),
      churnRate,
      retentionRate,
      conversionRate,
      metadata: { computedFrom: from.toISOString(), computedTo: to.toISOString() },
    },
  });

  return snapshot;
}

export async function getLatestSnapshot(period: KpiPeriod) {
  return prisma.kpiSnapshot.findFirst({
    where: { period },
    orderBy: { computedAt: "desc" },
  });
}

export async function getSnapshots(period: KpiPeriod, limit: number = 12) {
  return prisma.kpiSnapshot.findMany({
    where: { period },
    orderBy: { computedAt: "desc" },
    take: limit,
  });
}

export async function getMRR() {
  const snapshot = await prisma.kpiSnapshot.findFirst({
    where: { period: "MONTHLY" },
    orderBy: { computedAt: "desc" },
    select: { mrr: true },
  });
  return Number(snapshot?.mrr ?? 0);
}

export async function getARR() {
  const snapshot = await prisma.kpiSnapshot.findFirst({
    where: { period: "YEARLY" },
    orderBy: { computedAt: "desc" },
    select: { arr: true },
  });
  return Number(snapshot?.arr ?? 0);
}

export async function getRevenueChart(period: KpiPeriod, limit: number = 12) {
  const snapshots = await prisma.kpiSnapshot.findMany({
    where: { period },
    orderBy: { computedAt: "desc" },
    take: limit,
    select: {
      totalRevenue: true,
      recurringRevenue: true,
      installationRevenue: true,
      computedAt: true,
      dateFrom: true,
      dateTo: true,
    },
  });

  return snapshots.reverse().map((s) => ({
    date: s.dateFrom.toISOString().slice(0, 10),
    revenue: Number(s.totalRevenue ?? 0),
    recurringRevenue: Number(s.recurringRevenue ?? 0),
    installationRevenue: Number(s.installationRevenue ?? 0),
  }));
}

export async function getKPISummary() {
  const [daily, weekly, monthly, quarterly, yearly] = await Promise.all([
    getLatestSnapshot("DAILY"),
    getLatestSnapshot("WEEKLY"),
    getLatestSnapshot("MONTHLY"),
    getLatestSnapshot("QUARTERLY"),
    getLatestSnapshot("YEARLY"),
  ]);

  return { daily, weekly, monthly, quarterly, yearly };
}

function getPeriodStart(period: KpiPeriod, date: Date): Date {
  const d = new Date(date);
  switch (period) {
    case "DAILY":
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    case "WEEKLY": {
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    case "MONTHLY":
      return new Date(d.getFullYear(), d.getMonth(), 1);
    case "QUARTERLY": {
      const q = Math.floor(d.getMonth() / 3) * 3;
      return new Date(d.getFullYear(), q, 1);
    }
    case "YEARLY":
      return new Date(d.getFullYear(), 0, 1);
  }
}

function getPeriodEnd(period: KpiPeriod, date: Date): Date {
  const start = getPeriodStart(period, date);
  const end = new Date(start);
  switch (period) {
    case "DAILY":
      end.setDate(end.getDate() + 1);
      break;
    case "WEEKLY":
      end.setDate(end.getDate() + 7);
      break;
    case "MONTHLY":
      end.setMonth(end.getMonth() + 1);
      break;
    case "QUARTERLY":
      end.setMonth(end.getMonth() + 3);
      break;
    case "YEARLY":
      end.setFullYear(end.getFullYear() + 1);
      break;
  }
  end.setMilliseconds(-1);
  return end;
}
