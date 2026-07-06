import "server-only";
import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { TargetPeriod } from "@prisma/client";

export async function getTarget(salesProfileId: string, period: TargetPeriod, year: number, month?: number | null, week?: number | null) {
  const target = await prisma.salesTarget.findFirst({
    where: { salesProfileId, period, year, month: month ?? null, week: week ?? null },
  });
  return target;
}

export async function setTarget(data: {
  salesProfileId: string;
  period: TargetPeriod;
  year: number;
  month?: number | null;
  week?: number | null;
  leadsTarget?: number | null;
  conversionsTarget?: number | null;
  revenueTarget?: number | null;
  recurringRevenueTarget?: number | null;
  renewalsTarget?: number | null;
  retentionTarget?: number | null;
  installationsTarget?: number | null;
  trainingTarget?: number | null;
  collectionsTarget?: number | null;
}) {
  const existing = await prisma.salesTarget.findFirst({
    where: {
      salesProfileId: data.salesProfileId,
      period: data.period,
      year: data.year,
      month: data.month ?? null,
      week: data.week ?? null,
    },
  });

  const targetData: Record<string, unknown> = {};
  if (data.leadsTarget !== undefined) targetData.leadsTarget = data.leadsTarget;
  if (data.conversionsTarget !== undefined) targetData.conversionsTarget = data.conversionsTarget;
  if (data.revenueTarget !== undefined) targetData.revenueTarget = data.revenueTarget;
  if (data.recurringRevenueTarget !== undefined) targetData.recurringRevenueTarget = data.recurringRevenueTarget;
  if (data.renewalsTarget !== undefined) targetData.renewalsTarget = data.renewalsTarget;
  if (data.retentionTarget !== undefined) targetData.retentionTarget = data.retentionTarget;
  if (data.installationsTarget !== undefined) targetData.installationsTarget = data.installationsTarget;
  if (data.trainingTarget !== undefined) targetData.trainingTarget = data.trainingTarget;
  if (data.collectionsTarget !== undefined) targetData.collectionsTarget = data.collectionsTarget;

  if (existing) {
    return prisma.salesTarget.update({
      where: { id: existing.id },
      data: targetData as Prisma.SalesTargetUpdateInput,
    });
  }

  return prisma.salesTarget.create({
    data: {
      salesProfileId: data.salesProfileId,
      period: data.period,
      year: data.year,
      month: data.month ?? null,
      week: data.week ?? null,
      ...targetData,
    } as unknown as Prisma.SalesTargetCreateInput,
  });
}

export async function getCurrentTargets(salesProfileId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((startOfWeek.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = Math.ceil((dayOfYear + 1) / 7);

  const targets = await prisma.salesTarget.findMany({
    where: {
      salesProfileId,
      OR: [
        { period: "DAILY", year, month },
        { period: "WEEKLY", year, week: weekNum },
        { period: "MONTHLY", year, month },
        { period: "QUARTERLY", year, month: { in: [1, 4, 7, 10] } },
        { period: "YEARLY", year },
      ],
    },
  });

  return targets;
}

export async function getAllTargets(salesProfileId: string) {
  return prisma.salesTarget.findMany({
    where: { salesProfileId },
    orderBy: [{ year: "desc" }, { month: "desc" }, { week: "desc" }],
  });
}

export async function updateAchieved(salesProfileId: string, metric: string, value: number) {
  const currentTargets = await getCurrentTargets(salesProfileId);
  if (currentTargets.length === 0) return;

  const fieldMap: Record<string, string> = {
    leads: "achivedLeads",
    conversions: "achievedConversions",
    revenue: "achievedRevenue",
    recurringRevenue: "achievedRevenue",
    renewals: "achivedLeads",
    retention: "achievedConversions",
    installations: "achivedLeads",
    training: "achievedConversions",
    collections: "achievedRevenue",
  };

  const field = fieldMap[metric];
  if (!field) return;

  for (const target of currentTargets) {
    const current = (target as unknown as Record<string, unknown>)[field];
    const currentVal = current instanceof Prisma.Decimal ? Number(current) : (typeof current === "number" ? current : 0);
    await prisma.salesTarget.update({
      where: { id: target.id },
      data: { [field]: new Prisma.Decimal(currentVal + value) },
    });
  }
}

export async function getProgress(salesProfileId: string) {
  const targets = await getCurrentTargets(salesProfileId);
  if (targets.length === 0) return [];

  return targets.map((t) => {
    const progress: Record<string, { target: number; achieved: number; percent: number }> = {};

    const pairs: [string, string][] = [
      ["leadsTarget", "achivedLeads"],
      ["conversionsTarget", "achievedConversions"],
      ["revenueTarget", "achievedRevenue"],
      ["recurringRevenueTarget", "achievedRevenue"],
      ["renewalsTarget", "achivedLeads"],
      ["retentionTarget", "achievedConversions"],
      ["installationsTarget", "achivedLeads"],
      ["trainingTarget", "achievedConversions"],
      ["collectionsTarget", "achievedRevenue"],
    ];

    for (const [targetKey, achievedKey] of pairs) {
      const rawTarget = (t as unknown as Record<string, unknown>)[targetKey];
      const rawAchieved = (t as unknown as Record<string, unknown>)[achievedKey];
      const targetVal = rawTarget instanceof Prisma.Decimal ? Number(rawTarget) : (typeof rawTarget === "number" ? rawTarget : 0);
      const achievedVal = rawAchieved instanceof Prisma.Decimal ? Number(rawAchieved) : (typeof rawAchieved === "number" ? rawAchieved : 0);

      if (targetVal > 0) {
        progress[targetKey.replace("Target", "")] = {
          target: targetVal,
          achieved: achievedVal,
          percent: Math.round((achievedVal / targetVal) * 100),
        };
      }
    }

    return {
      id: t.id,
      period: t.period,
      year: t.year,
      month: t.month,
      week: t.week,
      progress,
    };
  });
}

export async function getTeamTargets(managerId: string) {
  const profiles = await prisma.salesProfile.findMany({
    where: { managerId },
    select: { id: true },
  });

  if (profiles.length === 0) return [];

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const targets = await prisma.salesTarget.findMany({
    where: {
      salesProfileId: { in: profiles.map((p) => p.id) },
      OR: [
        { period: "MONTHLY", year, month },
        { period: "YEARLY", year },
      ],
    },
    include: {
      salesProfile: {
        select: {
          id: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: [{ salesProfileId: "asc" }, { period: "asc" }],
  });

  return targets;
}

export async function getTargetSummary(period: TargetPeriod) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const where: Record<string, unknown> = { period, year };
  if (period === "MONTHLY") where.month = month;

  const targets = await prisma.salesTarget.findMany({ where: where as Prisma.SalesTargetWhereInput });

  const summary = {
    count: targets.length,
    totalLeadsTarget: 0,
    totalConversionsTarget: 0,
    totalRevenueTarget: 0,
    totalAchievedLeads: 0,
    totalAchievedConversions: 0,
    totalAchievedRevenue: 0,
  };

  for (const t of targets) {
    summary.totalLeadsTarget += t.leadsTarget ?? 0;
    summary.totalConversionsTarget += t.conversionsTarget ?? 0;
    summary.totalRevenueTarget += Number(t.revenueTarget ?? 0);
    summary.totalAchievedLeads += t.achivedLeads ?? 0;
    summary.totalAchievedConversions += t.achievedConversions ?? 0;
    summary.totalAchievedRevenue += Number(t.achievedRevenue ?? 0);
  }

  return summary;
}
