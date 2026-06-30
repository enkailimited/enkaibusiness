import "server-only";

import { prisma } from "@/server/db";

export interface PlanInfo {
  id: string;
  name: string;
  slug: string;
  amount: number;
  currency: string;
  interval: string;
  isActive: boolean;
}

export class SubscriptionPlanResolver {
  static async getDefaultPlan(): Promise<PlanInfo | null> {
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { isActive: true },
      orderBy: { amount: "asc" },
    });
    if (!plan) return null;
    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      amount: Number(plan.amount),
      currency: plan.currency,
      interval: plan.interval,
      isActive: plan.isActive,
    };
  }

  static async getDefaultPlanOrThrow(): Promise<PlanInfo> {
    const plan = await this.getDefaultPlan();
    if (!plan) {
      throw new Error(
        "No active default subscription plan exists. Please create and activate one from the Platform Dashboard.",
      );
    }
    return plan;
  }

  static async getPlanById(id: string): Promise<PlanInfo | null> {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) return null;
    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      amount: Number(plan.amount),
      currency: plan.currency,
      interval: plan.interval,
      isActive: plan.isActive,
    };
  }

  static async getPlanBySlug(slug: string): Promise<PlanInfo | null> {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { slug } });
    if (!plan) return null;
    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      amount: Number(plan.amount),
      currency: plan.currency,
      interval: plan.interval,
      isActive: plan.isActive,
    };
  }

  static async getActivePlans(): Promise<PlanInfo[]> {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { amount: "asc" },
    });
    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      amount: Number(p.amount),
      currency: p.currency,
      interval: p.interval,
      isActive: p.isActive,
    }));
  }

  static async validatePlan(planId: string): Promise<PlanInfo> {
    const plan = await this.getPlanById(planId);
    if (!plan) {
      throw new Error("Subscription plan not found");
    }
    if (!plan.isActive) {
      throw new Error("Subscription plan is not active");
    }
    return plan;
  }

  static validateBillingCycle(interval: string): void {
    const valid = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
    if (!valid.includes(interval)) {
      throw new Error(`Invalid billing cycle: ${interval}`);
    }
  }

  static computeEndDate(interval: string, from: Date = new Date()): Date {
    const end = new Date(from);
    switch (interval) {
      case "DAILY":
        return new Date(from.getTime() + 24 * 60 * 60 * 1000);
      case "WEEKLY":
        return new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
      case "MONTHLY":
        end.setMonth(end.getMonth() + 1);
        return end;
      case "YEARLY":
        end.setFullYear(end.getFullYear() + 1);
        return end;
      default:
        end.setMonth(end.getMonth() + 1);
        return end;
    }
  }

  static computeGraceEndDate(endDate: Date): Date {
    return new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
}
