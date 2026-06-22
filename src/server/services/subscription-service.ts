import "server-only";

import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type {
  CreateSubscriptionPlanSchema,
  UpdateSubscriptionPlanSchema,
  CreateSubscriptionSchema,
  RecordPaymentSchema,
} from "@/lib/validations/subscription";

export async function createPlan(
  data: CreateSubscriptionPlanSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const plan = await prisma.subscriptionPlan.create({
      data: {
        ...data,
        amount: new Prisma.Decimal(data.amount),
      },
    });

    return {
      success: true,
      message: "Subscription plan created successfully",
      data: { id: plan.id },
    };
  } catch (error) {
    console.error("Create subscription plan error:", error);
    return { success: false, message: "Failed to create subscription plan" };
  }
}

export async function getPlans() {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { amount: "asc" },
  });
}

export async function getPlan(id: string) {
  return prisma.subscriptionPlan.findUnique({ where: { id } });
}

export async function updatePlan(
  id: string,
  data: UpdateSubscriptionPlanSchema,
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, unknown> = { ...data };

    if (data.amount !== undefined) {
      updateData.amount = new Prisma.Decimal(data.amount);
    }

    await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });

    return { success: true, message: "Subscription plan updated successfully" };
  } catch (error) {
    console.error("Update subscription plan error:", error);
    return { success: false, message: "Failed to update subscription plan" };
  }
}

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
    }

    const graceEndDate = new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000);

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

export async function getSubscriptions(filters?: {
  status?: string;
  businessId?: string;
  planId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.businessId) where.businessId = filters.businessId;
  if (filters?.planId) where.planId = filters.planId;
  if (filters?.fromDate || filters?.toDate) {
    where.startDate = {};
    if (filters.fromDate) (where.startDate as Record<string, unknown>).gte = new Date(filters.fromDate);
    if (filters.toDate) (where.startDate as Record<string, unknown>).lte = new Date(filters.toDate);
  }

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: {
      plan: true,
      business: {
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { payments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const businessIds = subscriptions
    .map((s) => s.businessId)
    .filter((id): id is string => !!id);

  let businessCounts: Map<
    string,
    {
      catalogItems: number;
      units: number;
      categories: number;
      brands: number;
      customers: number;
      suppliers: number;
      branches: number;
      staff: number;
      uploads: number;
    }
  > = new Map();

  if (businessIds.length > 0) {
    const counts = await prisma.business.findMany({
      where: { id: { in: businessIds } },
      select: {
        id: true,
        _count: {
          select: {
            catalogItems: true,
            units: true,
            categories: true,
            brands: true,
            customers: true,
            suppliers: true,
            branches: true,
            staff: true,
            uploads: true,
          },
        },
      },
    });
    businessCounts = new Map(counts.map((c) => [c.id, c._count]));
  }

  return subscriptions.map((sub) => ({
    ...sub,
    business: sub.business
      ? {
          ...sub.business,
          _count: businessCounts.get(sub.businessId) ?? {
            catalogItems: 0,
            units: 0,
            categories: 0,
            brands: 0,
            customers: 0,
            suppliers: 0,
            branches: 0,
            staff: 0,
            uploads: 0,
          },
        }
      : null,
  }));
}

export async function getSubscription(id: string) {
  return prisma.subscription.findUnique({
    where: { id },
    include: {
      plan: true,
      business: true,
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
}

export async function updateSubscriptionStatus(
  id: string,
  status: string,
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, unknown> = { status };

    if (status === "SUSPENDED") {
      updateData.suspendedAt = new Date();
    } else if (status === "CANCELLED") {
      updateData.cancelledAt = new Date();
    } else if (status === "ACTIVE") {
      updateData.suspendedAt = null;
    }

    await prisma.subscription.update({
      where: { id },
      data: updateData,
    });

    return { success: true, message: `Subscription status updated to ${status}` };
  } catch (error) {
    console.error("Update subscription status error:", error);
    return { success: false, message: "Failed to update subscription status" };
  }
}

export async function recordPayment(
  data: RecordPaymentSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: data.subscriptionId },
    });

    if (!subscription) {
      return { success: false, message: "Subscription not found" };
    }

    const payment = await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: data.subscriptionId,
        amount: new Prisma.Decimal(data.amount),
        method: data.method || null,
        reference: data.reference || null,
      },
    });

    return {
      success: true,
      message: "Payment recorded successfully",
      data: { id: payment.id },
    };
  } catch (error) {
    console.error("Record payment error:", error);
    return { success: false, message: "Failed to record payment" };
  }
}

export async function getSubscriptionPayments(subscriptionId: string) {
  return prisma.subscriptionPayment.findMany({
    where: { subscriptionId },
    orderBy: { paidAt: "desc" },
  });
}

export async function processSubscriptionRenewals(): Promise<ActionResponse> {
  const now = new Date();

  const expiringSubs = await prisma.subscription.findMany({
    where: { status: "ACTIVE", endDate: { lte: now } },
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
        data: { status: "GRACE_PERIOD" },
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
        status: "GRACE_PERIOD",
        graceEndDate: { lte: now },
      },
      data: { status: "SUSPENDED", suspendedAt: now },
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
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "GRACE_PERIOD" } }),
    prisma.subscription.count({ where: { status: "SUSPENDED" } }),
    prisma.subscription.count({ where: { status: "EXPIRED" } }),
    prisma.subscription.count({ where: { status: "CANCELLED" } }),
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
