import "server-only";

import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import type { DateRange, SubscriptionsReport, PlanDistribution } from "../types";

function buildDateFilter(dateRange?: DateRange): Record<string, Date> | undefined {
  if (!dateRange) return undefined;
  const filter: Record<string, Date> = {};
  if (dateRange.startDate) filter.gte = new Date(dateRange.startDate);
  if (dateRange.endDate) filter.lte = new Date(dateRange.endDate);
  return Object.keys(filter).length ? filter : undefined;
}

export async function getSubscriptionSummary(
  dateRange?: DateRange,
): Promise<SubscriptionsReport> {
  const dateFilter = buildDateFilter(dateRange);

  const [activeSubs, churnedSubs, planGroups, revenueData] = await Promise.all([
    prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      include: { plan: true },
    }),
    dateFilter
      ? prisma.subscription.count({
          where: {
            status: SubscriptionStatus.CANCELLED,
            cancelledAt: dateFilter,
          },
        })
      : Promise.resolve(0),
    prisma.subscription.groupBy({
      by: ["planId"],
      where: { status: SubscriptionStatus.ACTIVE },
      _count: true,
    }),
    prisma.subscriptionPayment.aggregate({
      _sum: { amount: true },
      ...(dateFilter
        ? { where: { paidAt: dateFilter } }
        : {}),
    }),
  ]);

  const totalActive = activeSubs.length;
  let mrr = 0;
  for (const sub of activeSubs) {
    const amount = Number(sub.plan.amount);
    if (sub.plan.interval === "MONTHLY") {
      mrr += amount;
    } else if (sub.plan.interval === "YEARLY") {
      mrr += amount / 12;
    } else if (sub.plan.interval === "WEEKLY") {
      mrr += amount * 4.33;
    } else if (sub.plan.interval === "DAILY") {
      mrr += amount * 30;
    }
  }

  const arpu = totalActive > 0 ? mrr / totalActive : 0;
  const totalRevenue = Number(revenueData._sum.amount) || 0;

  const planIds = planGroups.map((p) => p.planId);
  const planMap = new Map<string, { name: string; amount: number; interval: string }>();
  if (planIds.length > 0) {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true, amount: true, interval: true },
    });
    for (const p of plans) {
      planMap.set(p.id, {
        name: p.name,
        amount: Number(p.amount),
        interval: p.interval,
      });
    }
  }

  const churnRate =
    totalActive + churnedSubs > 0
      ? churnedSubs / (totalActive + churnedSubs)
      : 0;

  return {
    summary: {
      totalActive,
      mrr: Math.round(mrr * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      totalRevenue,
    },
    churnRate,
    planDistribution: planGroups.map((p) => {
      const plan = planMap.get(p.planId);
      const planMrr = plan
        ? plan.interval === "MONTHLY"
          ? plan.amount * p._count
          : plan.interval === "YEARLY"
            ? (plan.amount / 12) * p._count
            : plan.interval === "WEEKLY"
              ? plan.amount * 4.33 * p._count
              : plan.amount * 30 * p._count
        : 0;
      return {
        planId: p.planId,
        planName: plan?.name ?? "Unknown",
        subscriberCount: p._count,
        mrr: Math.round(planMrr * 100) / 100,
      };
    }),
  };
}

export async function getChurnRate(
  dateRange?: DateRange,
): Promise<number> {
  const dateFilter = buildDateFilter(dateRange);

  const [totalActive, cancelled] = await Promise.all([
    prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
    dateFilter
      ? prisma.subscription.count({
          where: { status: SubscriptionStatus.CANCELLED, cancelledAt: dateFilter },
        })
      : prisma.subscription.count({ where: { status: SubscriptionStatus.CANCELLED } }),
  ]);

  return totalActive + cancelled > 0 ? cancelled / (totalActive + cancelled) : 0;
}

export async function getPlanDistribution(): Promise<PlanDistribution[]> {
  const planGroups = await prisma.subscription.groupBy({
    by: ["planId"],
    where: { status: SubscriptionStatus.ACTIVE },
    _count: true,
  });

  const planIds = planGroups.map((p) => p.planId);
  const planMap = new Map<string, { name: string; amount: number; interval: string }>();
  if (planIds.length > 0) {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true, amount: true, interval: true },
    });
    for (const p of plans) {
      planMap.set(p.id, {
        name: p.name,
        amount: Number(p.amount),
        interval: p.interval,
      });
    }
  }

  return planGroups.map((p) => {
    const plan = planMap.get(p.planId);
    const planMrr = plan
      ? plan.interval === "MONTHLY"
        ? plan.amount * p._count
        : plan.interval === "YEARLY"
          ? (plan.amount / 12) * p._count
          : plan.interval === "WEEKLY"
            ? plan.amount * 4.33 * p._count
            : plan.amount * 30 * p._count
      : 0;
    return {
      planId: p.planId,
      planName: plan?.name ?? "Unknown",
      subscriberCount: p._count,
      mrr: Math.round(planMrr * 100) / 100,
    };
  });
}
