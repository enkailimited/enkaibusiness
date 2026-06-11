import "server-only";

import { prisma } from "@/server/db";
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

    const graceEndDate = new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const existingActive = await prisma.subscription.findFirst({
      where: {
        businessId: data.businessId,
        status: { in: ["ACTIVE", "GRACE_PERIOD"] },
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
      business: { select: { id: true, name: true, legalName: true } },
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
    if (existing.status === "CANCELLED") {
      return { success: false, message: "Subscription is already cancelled" };
    }

    await prisma.subscription.update({
      where: { id },
      data: {
        status: "CANCELLED",
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

    const graceEndDate = new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: "ACTIVE",
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

    if (status === "SUSPENDED") {
      updateData.suspendedAt = new Date();
    } else if (status === "CANCELLED") {
      updateData.cancelledAt = new Date();
      updateData.endDate = new Date();
    } else if (status === "ACTIVE") {
      updateData.suspendedAt = null;
    }

    await prisma.subscription.update({ where: { id }, data: updateData });

    return { success: true, message: `Subscription status updated to ${status}` };
  } catch (error) {
    console.error("Update subscription status error:", error);
    return { success: false, message: "Failed to update subscription status" };
  }
}

export async function checkExpiringSubscriptions(): Promise<ActionResponse> {
  try {
    const now = new Date();
    const graceThreshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiring = await prisma.subscription.updateMany({
      where: {
        status: "ACTIVE",
        endDate: { lte: graceThreshold, gte: now },
      },
      data: { status: "GRACE_PERIOD" },
    });

    const expired = await prisma.subscription.updateMany({
      where: {
        status: "GRACE_PERIOD",
        graceEndDate: { lte: now },
      },
      data: { status: "EXPIRED" },
    });

    return {
      success: true,
      message: `Moved ${expiring.count} to grace period, ${expired.count} expired`,
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
