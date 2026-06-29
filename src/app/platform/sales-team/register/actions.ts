"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { serialize } from "@/lib/utils";
import { calculateDailyPrice, calculateSetupFee } from "@/features/subscriptions/constants/pricing";
import { BusinessRegistrationEngine } from "@/server/registrations";
import { ensureRbacWorkspaceRole } from "@/features/workspaces/services/workspace-service";
import type { ActionResponse } from "@/types/relationships";

interface RegisterInput {
  leadId: string;
  business: {
    name: string;
    slug: string;
    industry: string;
    modes: string[];
    address?: string;
  };
  planId: string;
  businessSize: string;
  qrOrderingEnabled: boolean;
}

export async function registerCustomerBusinessAction(
  input: RegisterInput,
): Promise<ActionResponse & { data?: { businessId: string; workspaceId: string; subscriptionId: string } }> {
  try {
    const agent = await requireAuth();
    const { leadId, business, planId, businessSize, qrOrderingEnabled } = input;

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { success: false, message: "Lead not found" };
    if (!lead.convertedToUserId) return { success: false, message: "Lead has not been converted to a user yet" };

    const user = await prisma.user.findUnique({ where: { id: lead.convertedToUserId } });
    if (!user) return { success: false, message: "Converted user not found" };

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return { success: false, message: "Invalid or inactive subscription plan" };
    }

    const dailyRate = Number(plan.amount) / (plan.interval === "WEEKLY" ? 7 : plan.interval === "MONTHLY" ? 30 : 1);
    const dailyPrice = calculateDailyPrice(dailyRate, businessSize, qrOrderingEnabled);
    const { setupFee, qrPrintingFee, total: totalSetupFee } = calculateSetupFee(qrOrderingEnabled, business.modes);

    // Pre-step: Create workspace + workspace membership for the lead user
    const workspace = await prisma.workspace.create({
      data: {
        name: `${business.name} Workspace`,
        slug: `${business.slug}-${Date.now()}`,
        description: `Workspace for ${business.name}`,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    await ensureRbacWorkspaceRole(user.id, "OWNER");

    // Delegate business creation to the canonical engine
    const result = await BusinessRegistrationEngine.register(
      {
        name: business.name,
        slug: business.slug,
        workspaceId: workspace.id,
        createdById: user.id,
        updatedById: agent.id,
        email: user.email || lead.email || undefined,
        phone: user.phone || lead.phone || undefined,
        address: business.address || undefined,
        industry: business.industry as any,
        modes: business.modes,
        planId,
        businessSize,
      },
      { id: plan.id, amount: Number(plan.amount), interval: plan.interval, name: plan.name },
      { dailyPrice, setupFee, qrPrintingFee, totalSetupFee },
    );

    if (!result.success) {
      return { success: false, message: result.message };
    }

    // Post-step: Record lead activity
    await prisma.leadActivity.create({
      data: {
        leadId,
        action: "REGISTERED",
        detail: `Business "${business.name}" registered with ${plan.name} plan at ${dailyPrice} TZS/day`,
        createdById: agent.id,
      },
    });

    revalidatePath("/platform/sales-team/clients");

    return {
      success: true,
      message: result.message,
      data: {
        businessId: result.data!.businessId,
        workspaceId: workspace.id,
        subscriptionId: result.data!.subscriptionId,
      },
    };
  } catch (error) {
    console.error("Register customer business error:", error);
    return { success: false, message: "Failed to register customer business" };
  }
}

export async function listPlansForRegistrationAction() {
  await requireAuth();
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { amount: "asc" },
  });
  return serialize(plans);
}

export async function getReadyToRegisterLeadsAction() {
  const agent = await requireAuth();

  const profile = await prisma.salesProfile.findUnique({
    where: { userId: agent.id },
  });

  const leads = await prisma.lead.findMany({
    where: {
      status: "CONVERTED",
      convertedToUserId: { not: null },
      assignedToId: profile?.id ?? undefined,
      activities: {
        none: { action: "REGISTERED" },
      },
    },
    orderBy: { convertedAt: "desc" },
  });

  const userIds = leads.map((l) => l.convertedToUserId).filter(Boolean) as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const enriched = leads.map((lead) => ({
    ...lead,
    convertedToUser: lead.convertedToUserId ? userMap.get(lead.convertedToUserId) ?? null : null,
  }));

  return serialize(enriched);
}
