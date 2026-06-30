import "server-only";

import { prisma } from "@/server/db";
import { Prisma, SubscriptionStatus } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type { CreateSubscriptionSchema } from "../schemas";
import type { SubscriptionWithRelations, SubscriptionListItem, SubscriptionFilter } from "../types";

export async function subscribe(
  data: CreateSubscriptionSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: data.planId },
    });

    if (!plan) {
      return { success: false, message: "Subscription plan not found" };
    }
    if (!plan.isActive) {
      return { success: false, message: "Subscription plan is not active" };
    }

    const now = new Date();
    let endDate: Date;

    switch (plan.interval) {
      case "DAILY":
        endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case "WEEKLY":
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "MONTHLY":
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case "YEARLY":
        endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);
    }

    const graceEndDate = new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const existingActive = await prisma.subscription.findFirst({
      where: {
        businessId: data.businessId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE_PERIOD] },
      },
    });

    if (existingActive) {
      return {
        success: false,
        message: "Business already has an active subscription",
      };
    }

    const subscription = await prisma.subscription.create({
      data: {
        planId: data.planId,
        businessId: data.businessId,
        startDate: now,
        endDate,
        graceEndDate,
      },
    });

    return {
      success: true,
      message: "Subscription created successfully",
      data: { id: subscription.id },
    };
  } catch (error) {
    console.error("Subscribe error:", error);
    return { success: false, message: "Failed to create subscription" };
  }
}

export async function getSubscription(id: string): Promise<SubscriptionWithRelations | null> {
  const raw = await prisma.subscription.findUnique({
    where: { id },
    include: {
      plan: true,
      business: { select: { id: true, name: true } },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  if (!raw) return null;

  return {
    ...raw,
    _count: { payments: raw.payments.length },
  } as unknown as SubscriptionWithRelations;
}

export async function listSubscriptions(
  filters?: SubscriptionFilter,
): Promise<SubscriptionListItem[]> {
  const where: Record<string, unknown> = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.businessId) where.businessId = filters.businessId;
  if (filters?.planId) where.planId = filters.planId;
  if (filters?.fromDate || filters?.toDate) {
    where.startDate = {};
    if (filters.fromDate)
      (where.startDate as Record<string, unknown>).gte = new Date(filters.fromDate);
    if (filters.toDate)
      (where.startDate as Record<string, unknown>).lte = new Date(filters.toDate);
  }

  return prisma.subscription.findMany({
    where,
    include: {
      plan: { select: { id: true, name: true, amount: true, interval: true } },
      business: { select: { id: true, name: true } },
      _count: { select: { payments: true } },
    },
    orderBy: { createdAt: "desc" },
  }) as unknown as SubscriptionListItem[];
}

export async function cancelSubscription(id: string): Promise<ActionResponse> {
  try {
    const existing = await prisma.subscription.findUnique({ where: { id } });

    if (!existing) return { success: false, message: "Subscription not found" };
    if (existing.status === SubscriptionStatus.CANCELLED) {
      return { success: false, message: "Subscription is already cancelled" };
    }

    await prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        endDate: new Date(),
      },
    });

    return { success: true, message: "Subscription cancelled successfully" };
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return { success: false, message: "Failed to cancel subscription" };
  }
}

export async function renewSubscription(id: string): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const existing = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!existing) return { success: false, message: "Subscription not found" };

    const now = new Date();
    let endDate: Date;

    switch (existing.plan.interval) {
      case "DAILY":
        endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case "WEEKLY":
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "MONTHLY":
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case "YEARLY":
        endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);
    }

    const graceEndDate = new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        endDate,
        graceEndDate,
        suspendedAt: null,
        cancelledAt: null,
      },
    });

    return {
      success: true,
      message: "Subscription renewed successfully",
      data: { id: updated.id },
    };
  } catch (error) {
    console.error("Renew subscription error:", error);
    return { success: false, message: "Failed to renew subscription" };
  }
}

export async function updateSubscriptionStatus(
  id: string,
  status: string,
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, unknown> = { status };

    if (status === SubscriptionStatus.SUSPENDED) {
      updateData.suspendedAt = new Date();
    } else if (status === SubscriptionStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
      updateData.endDate = new Date();
    } else if (status === SubscriptionStatus.ACTIVE) {
      updateData.suspendedAt = null;
    }

    const sub = await prisma.subscription.findUnique({
      where: { id },
      select: { status: true, businessId: true },
    });
    if (!sub) return { success: false, message: "Subscription not found" };

    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({ where: { id }, data: updateData });

      if (status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.GRACE_PERIOD) {
        await tx.business.update({
          where: { id: sub.businessId },
          data: { status: "ACTIVE", isActive: true },
        });
      } else if (status === SubscriptionStatus.SUSPENDED) {
        await tx.business.update({
          where: { id: sub.businessId },
          data: { status: "SUSPENDED", isActive: false },
        });
      } else if (status === SubscriptionStatus.EXPIRED || status === SubscriptionStatus.CANCELLED) {
        await tx.business.update({
          where: { id: sub.businessId },
          data: { status: "INACTIVE", isActive: false },
        });
      }
    });

    return { success: true, message: `Subscription status updated to ${status}` };
  } catch (error) {
    console.error("Update subscription status error:", error);
    return { success: false, message: "Failed to update subscription status" };
  }
}

export async function processSubscriptionRenewals(): Promise<ActionResponse> {
  const now = new Date();

  const expiringSubs = await prisma.subscription.findMany({
    where: { status: SubscriptionStatus.ACTIVE, endDate: { lte: now } },
    include: { plan: { select: { id: true, name: true, amount: true, interval: true } } },
    take: 100,
  });

  let renewed = 0;
  let gracePeriod = 0;

  for (const sub of expiringSubs) {
    const businessId = sub.businessId;

    const setting = await prisma.setting.findUnique({
      where: { businessId_key: { businessId, key: "daily_price" } },
    });
    const dailyPrice = setting ? Number(setting.value) : Number(sub.plan.amount);

    const wallet = await prisma.subscriptionWallet.findUnique({
      where: { businessId },
    });

    const balance = wallet ? Number(wallet.balance) : 0;

    if (balance >= dailyPrice) {
      try {
        await prisma.$transaction(async (tx) => {
          const w = await tx.subscriptionWallet.findUnique({
            where: { businessId },
          });
          if (!w) return;

          const balBefore = Number(w.balance);
          const balAfter = Math.max(0, balBefore - dailyPrice);

          await tx.subscriptionWallet.update({
            where: { businessId },
            data: {
              balance: new Prisma.Decimal(balAfter),
              totalConsumed: new Prisma.Decimal(Number(w.totalConsumed) + dailyPrice),
            },
          });

          await tx.subscriptionTransaction.create({
            data: {
              walletId: w.id,
              type: "consumption",
              amount: new Prisma.Decimal(dailyPrice),
              balanceBefore: new Prisma.Decimal(balBefore),
              balanceAfter: new Prisma.Decimal(balAfter),
              reference: "AUTO_RENEW",
              description: `Auto-renewal - ${sub.plan.name}`,
            },
          });

          let newEndDate: Date;
          switch (sub.plan.interval) {
            case "DAILY": newEndDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); break;
            case "WEEKLY": newEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); break;
            case "MONTHLY": newEndDate = new Date(now); newEndDate.setMonth(newEndDate.getMonth() + 1); break;
            case "YEARLY": newEndDate = new Date(now); newEndDate.setFullYear(newEndDate.getFullYear() + 1); break;
            default: newEndDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          }

          const newGraceEnd = new Date(newEndDate.getTime() + 30 * 24 * 60 * 60 * 1000);

          await tx.subscription.update({
            where: { id: sub.id },
            data: { endDate: newEndDate, graceEndDate: newGraceEnd },
          });
        });
        renewed++;
      } catch (error) {
        console.error(`Renewal failed for ${sub.id}:`, error);
      }
    } else {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: SubscriptionStatus.GRACE_PERIOD },
      });
      gracePeriod++;
    }
  }

  return {
    success: true,
    message: `Renewed ${renewed}, moved ${gracePeriod} to grace period`,
  };
}

export async function checkExpiringSubscriptions(): Promise<ActionResponse> {
  try {
    const now = new Date();

    const suspended = await prisma.subscription.updateMany({
      where: {
        status: SubscriptionStatus.GRACE_PERIOD,
        graceEndDate: { lte: now },
      },
      data: { status: SubscriptionStatus.SUSPENDED, suspendedAt: now },
    });

    return {
      success: true,
      message: `Suspended ${suspended.count} expired subscriptions`,
    };
  } catch (error) {
    console.error("Check expiring subscriptions error:", error);
    return { success: false, message: "Failed to check expiring subscriptions" };
  }
}

export async function getSubscriptionMetrics() {
  const [active, gracePeriod, suspended, expired, cancelled, payments] = await Promise.all([
    prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
    prisma.subscription.count({ where: { status: SubscriptionStatus.GRACE_PERIOD } }),
    prisma.subscription.count({ where: { status: SubscriptionStatus.SUSPENDED } }),
    prisma.subscription.count({ where: { status: SubscriptionStatus.EXPIRED } }),
    prisma.subscription.count({ where: { status: SubscriptionStatus.CANCELLED } }),
    prisma.subscriptionPayment.aggregate({ _sum: { amount: true } }),
  ]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const revenue30d = await prisma.subscriptionPayment.aggregate({
    _sum: { amount: true },
    where: { paidAt: { gte: thirtyDaysAgo } },
  });

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const paymentsByPeriod = await prisma.subscriptionPayment.findMany({
    where: { paidAt: { gte: twelveMonthsAgo } },
    select: { amount: true, paidAt: true },
    orderBy: { paidAt: "asc" },
  });

  const revenueByPeriod = paymentsByPeriod.reduce<Record<string, number>>((acc, p) => {
    const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
    acc[key] = (acc[key] || 0) + Number(p.amount);
    return acc;
  }, {});

  return {
    active,
    gracePeriod,
    suspended,
    expired,
    cancelled,
    totalRevenue: Number(payments._sum.amount) || 0,
    revenue30d: Number(revenue30d._sum.amount) || 0,
    revenueByPeriod,
  };
}
