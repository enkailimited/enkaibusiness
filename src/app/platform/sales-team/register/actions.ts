"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { serialize } from "@/lib/utils";
import { calculateDailyPrice, calculateSetupFee, QR_CODE_STICKER_COUNT, QR_CODE_STICKER_PRICE } from "@/features/subscriptions/constants/pricing";
import { setBusinessSetting } from "@/features/businesses/services/setting-service";
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

    const newBusiness = await prisma.business.create({
      data: {
        workspaceId: workspace.id,
        name: business.name,
        slug: business.slug,
        email: user.email || lead.email || undefined,
        phone: user.phone || lead.phone || undefined,
        address: business.address || undefined,
        createdById: agent.id,
        updatedById: agent.id,
        modes: {
          create: business.modes.map((mode) => ({
            industry: business.industry,
            mode,
          })),
        },
      },
    });

    const ownerRole = await prisma.role.findUnique({ where: { slug: "owner" } });
    if (ownerRole) {
      const existing = await prisma.userRole.findFirst({
        where: { userId: user.id, roleId: ownerRole.id, businessId: newBusiness.id },
      });
      if (!existing) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: ownerRole.id, businessId: newBusiness.id },
        });
      }
    }

    const now = new Date();
    let endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (plan.interval === "WEEKLY") {
      endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (plan.interval === "MONTHLY") {
      endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.interval === "YEARLY") {
      endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    const graceEndDate = new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.create({
      data: {
        planId,
        businessId: newBusiness.id,
        startDate: now,
        endDate,
        graceEndDate,
      },
    });

    await prisma.subscriptionWallet.create({
      data: {
        businessId: newBusiness.id,
        totalDeposited: totalSetupFee,
        balance: totalSetupFee,
      },
    });

    if (totalSetupFee > 0) {
      const wallet = await prisma.subscriptionWallet.findUnique({ where: { businessId: newBusiness.id } });
      if (wallet) {
        const descParts: string[] = [];
        if (setupFee > 0) descParts.push(`Setup fee (${setupFee} TZS)`);
        if (qrPrintingFee > 0) descParts.push(`QR sticker printing ${QR_CODE_STICKER_COUNT} × ${QR_CODE_STICKER_PRICE} (${qrPrintingFee} TZS)`);
        await prisma.subscriptionTransaction.create({
          data: {
            walletId: wallet.id,
            type: "deposit",
            amount: totalSetupFee,
            balanceBefore: 0,
            balanceAfter: totalSetupFee,
            reference: "SETUP_FEE",
            description: descParts.join(" + "),
          },
        });
      }
    }

    await setBusinessSetting(newBusiness.id, "business_size", businessSize, "string", "Business size category");
    await setBusinessSetting(newBusiness.id, "qr_ordering_enabled", qrOrderingEnabled ? "true" : "false", "boolean", "Whether QR ordering is enabled for this business");
    await setBusinessSetting(newBusiness.id, "setup_fee", String(totalSetupFee), "number", "One-time setup fee");
    await setBusinessSetting(newBusiness.id, "daily_price", String(dailyPrice), "number", "Calculated daily subscription price");

    await prisma.leadActivity.create({
      data: {
        leadId,
        action: "REGISTERED",
        detail: `Business "${newBusiness.name}" registered with ${plan.name} plan at ${dailyPrice} TZS/day`,
        createdById: agent.id,
      },
    });

    revalidatePath("/platform/sales-team/clients");

    return {
      success: true,
      message: `Business "${newBusiness.name}" registered successfully with ${plan.name}`,
      data: {
        businessId: newBusiness.id,
        workspaceId: workspace.id,
        subscriptionId: subscription.id,
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
