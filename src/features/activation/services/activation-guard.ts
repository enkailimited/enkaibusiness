import "server-only";

import { prisma } from "@/server/db";

export interface ActivationGuardResult {
  allowed: boolean;
  reason?: string;
  redirectTo?: string;
  businessStatus?: string;
  subscriptionStatus?: string | null;
  walletBalance?: number;
  setupFee?: number;
}

export async function requireActiveBusiness(businessId: string): Promise<ActivationGuardResult> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      status: true,
      name: true,
    },
  });

  if (!business) {
    return { allowed: false, reason: "Business not found" };
  }

  if (business.status === "ACTIVE") {
    return { allowed: true };
  }

  const subscription = await prisma.subscription.findFirst({
    where: { businessId, status: { notIn: ["CANCELLED", "EXPIRED"] } },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });

  return {
    allowed: false,
    reason: business.status === "PENDING_SETUP"
      ? "Business is pending setup fee payment"
      : business.status === "SUSPENDED"
        ? "Business is suspended"
        : business.status === "INACTIVE"
          ? "Business is inactive"
          : "Business is not active",
    redirectTo: `/workspaces/businesses/${businessId}/activation`,
    businessStatus: business.status,
    subscriptionStatus: subscription?.status ?? null,
  };
}

export async function requireActiveSubscription(businessId: string): Promise<{
  active: boolean;
  reason?: string;
  subscriptionId?: string;
}> {
  const subscription = await prisma.subscription.findFirst({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, endDate: true },
  });

  if (!subscription) {
    return { active: false, reason: "No subscription found" };
  }

  if (subscription.status !== "ACTIVE") {
    return { active: false, reason: `Subscription is ${subscription.status.toLowerCase()}` };
  }

  if (subscription.endDate && subscription.endDate < new Date()) {
    return { active: false, reason: "Subscription has expired" };
  }

  return { active: true, subscriptionId: subscription.id };
}
