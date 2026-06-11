import "server-only";

import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type { CreateSubscriptionPlanSchema, UpdateSubscriptionPlanSchema } from "../schemas";
import type { PlanWithRelations, PlanFilter } from "../types";

export async function createPlan(
  data: CreateSubscriptionPlanSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        amount: new Prisma.Decimal(data.amount),
        currency: data.currency,
        interval: data.interval as any,
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

export async function getPlan(id: string) {
  return prisma.subscriptionPlan.findUnique({ where: { id } });
}

export async function getPlanBySlug(slug: string) {
  return prisma.subscriptionPlan.findUnique({ where: { slug } });
}

export async function listPlans(filter?: PlanFilter): Promise<PlanWithRelations[]> {
  const where: Record<string, unknown> = {};

  if (filter?.isActive !== undefined) where.isActive = filter.isActive;
  if (filter?.interval) where.interval = filter.interval;

  return prisma.subscriptionPlan.findMany({
    where,
    include: { _count: { select: { subscriptions: true } } },
    orderBy: { amount: "asc" },
  }) as unknown as PlanWithRelations[];
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
    if (data.description !== undefined) {
      updateData.description = data.description || null;
    }
    if (data.interval !== undefined) {
      updateData.interval = data.interval;
    }

    await prisma.subscriptionPlan.update({ where: { id }, data: updateData });

    return { success: true, message: "Subscription plan updated successfully" };
  } catch (error) {
    console.error("Update subscription plan error:", error);
    return { success: false, message: "Failed to update subscription plan" };
  }
}

export async function deletePlan(id: string): Promise<ActionResponse> {
  try {
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } },
    });

    if (!existing) return { success: false, message: "Subscription plan not found" };

    if (existing._count.subscriptions > 0) {
      return {
        success: false,
        message: "Cannot delete plan with active subscriptions. Deactivate it instead.",
      };
    }

    await prisma.subscriptionPlan.delete({ where: { id } });

    return { success: true, message: "Subscription plan deleted successfully" };
  } catch (error) {
    console.error("Delete subscription plan error:", error);
    return { success: false, message: "Failed to delete subscription plan" };
  }
}

export async function togglePlanActive(
  id: string,
  isActive: boolean,
): Promise<ActionResponse> {
  try {
    await prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive },
    });

    return {
      success: true,
      message: `Plan ${isActive ? "activated" : "deactivated"} successfully`,
    };
  } catch (error) {
    console.error("Toggle plan active error:", error);
    return { success: false, message: "Failed to update plan status" };
  }
}
