"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { serialize } from "@/lib/utils";
import { createBusinessSchema, registerBusinessSchema, updateBusinessSchema } from "../schemas";
import type { CreateBusinessSchema, RegisterBusinessInput } from "../schemas";
import { calculateDailyPrice, calculateSetupFee, QR_CODE_STICKER_COUNT, QR_CODE_STICKER_PRICE } from "@/features/subscriptions/constants/pricing";
import { getBusinessSetting, setBusinessSetting, getBusinessSettingsMap } from "@/features/businesses/services/setting-service";
import { recordTransaction } from "@/features/subscriptions/wallet/services/wallet-service";
import { BusinessRegistrationEngine } from "@/server/registrations";
import { ensureRbacWorkspaceRole } from "@/features/workspaces/services/workspace-service";
import type { ActionResponse } from "@/types/relationships";
import { SubscriptionStatus } from "@prisma/client";

async function syncBusinessStatus(businessId: string): Promise<string | null> {
  const sub = await prisma.subscription.findFirst({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });
  if (!sub) return null;

  const biz = await prisma.business.findUnique({
    where: { id: businessId },
    select: { status: true, isActive: true },
  });
  if (!biz) return null;

  if (sub.status === SubscriptionStatus.ACTIVE || sub.status === SubscriptionStatus.GRACE_PERIOD) {
    if (biz.status !== "ACTIVE" || !biz.isActive) {
      await prisma.business.update({
        where: { id: businessId },
        data: { status: "ACTIVE", isActive: true },
      });
    }
  } else if (sub.status === SubscriptionStatus.SUSPENDED) {
    if (biz.status !== "SUSPENDED") {
      await prisma.business.update({
        where: { id: businessId },
        data: { status: "SUSPENDED", isActive: false },
      });
    }
  } else {
    if (biz.status === "ACTIVE" || biz.isActive) {
      await prisma.business.update({
        where: { id: businessId },
        data: { status: "INACTIVE", isActive: false },
      });
    }
  }

  return sub.status;
}

async function getBusiness(id: string) {
  await syncBusinessStatus(id);
  return prisma.business.findUnique({
    where: { id },
    include: {
      modes: true,
      branches: {
        include: { _count: { select: { stores: true } } },
      },
      _count: { select: { branches: true } },
    },
  });
}

async function getWorkspaceBusinesses(workspaceId: string) {
  return prisma.business.findMany({
    where: { workspaceId },
    include: {
      modes: true,
      _count: { select: { branches: true } },
    },
    orderBy: { name: "asc" },
  });
}

async function updateBusiness(
  id: string,
  data: Partial<CreateBusinessSchema>,
  userId: string,
) {
  try {
    const { industry, modes, ...businessData } = data;

    await prisma.business.update({
      where: { id },
      data: {
        ...businessData,
        updatedById: userId,
      },
    });

    if (industry && modes) {
      await prisma.businessMode.deleteMany({
        where: { businessId: id },
      });

      await prisma.businessMode.createMany({
        data: modes.map((mode) => ({
          businessId: id,
          industry: industry,
          mode,
        })),
      });
    }

    return { success: true, message: "Business updated successfully" };
  } catch (error) {
    console.error("Update business error:", error);
    return { success: false, message: "Failed to update business" };
  }
}

async function deleteBusiness(id: string) {
  try {
    await prisma.business.delete({ where: { id } });
    return { success: true, message: "Business deleted successfully" };
  } catch (error) {
    console.error("Delete business error:", error);
    return { success: false, message: "Failed to delete business" };
  }
}

export async function createBusinessAction(
  workspaceId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const user = await requireAuth();

    const parsed = createBusinessSchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      email: formData.get("email") || undefined,
      phone: formData.get("phone") || undefined,
      address: formData.get("address") || undefined,
      currency: formData.get("currency") || "TZS",
      timezone: formData.get("timezone") || "Africa/Dar_es_Salaam",
      taxId: formData.get("taxId") || undefined,
      industry: formData.get("industry"),
      modes: JSON.parse((formData.get("modes") as string) || "[]"),
    });

    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { industry, modes, ...businessData } = parsed.data;

    const planId = formData.get("planId") as string;
    const businessSize = (formData.get("businessSize") as string) || "small";

    if (!planId) {
      return { success: false, message: "Subscription plan is required" };
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return { success: false, message: "Invalid or inactive subscription plan" };
    }

    const dailyRate = Number(plan.amount) / (plan.interval === "WEEKLY" ? 7 : plan.interval === "MONTHLY" ? 30 : 1);
    const dailyPrice = calculateDailyPrice(dailyRate, businessSize, false);
    const { setupFee, qrPrintingFee, total: totalSetupFee } = calculateSetupFee(false, modes);

    const result = await BusinessRegistrationEngine.register(
      {
        ...businessData,
        workspaceId,
        createdById: user.id,
        industry,
        modes,
        planId,
        businessSize,
      },
      { id: plan.id, amount: Number(plan.amount), interval: plan.interval, name: plan.name },
      { dailyPrice, setupFee, qrPrintingFee, totalSetupFee },
    );

    if (!result.success) {
      return { success: false, message: result.message };
    }

    revalidatePath(`/workspaces/${workspaceId}`);

    return {
      success: true,
      message: result.message,
      data: { id: result.data!.businessId, subscriptionId: result.data!.subscriptionId },
    };
  } catch (error) {
    console.error("createBusinessAction error:", error);
    return { success: false, message: "Failed to create business. Please try again." };
  }
}

export async function registerBusinessAction(
  input: RegisterBusinessInput,
): Promise<ActionResponse & { data?: { businessId: string; workspaceId?: string; subscriptionId: string } }> {
  try {
    const user = await requireAuth();

    const parsed = registerBusinessSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { workspaceId, leadId, qrOrderingEnabled, modes, industry, ...rest } = parsed.data;

    let targetWorkspaceId = workspaceId;
    let createdById = user.id;

    if (leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) return { success: false, message: "Lead not found" };
      if (!lead.convertedToUserId) return { success: false, message: "Lead has not been converted to a user yet" };

      const leadUser = await prisma.user.findUnique({ where: { id: lead.convertedToUserId } });
      if (!leadUser) return { success: false, message: "Converted user not found" };
      createdById = leadUser.id;

      const workspace = await prisma.workspace.create({
        data: {
          name: `${rest.name} Workspace`,
          slug: `${rest.slug}-${Date.now()}`,
          description: `Workspace for ${rest.name}`,
          members: { create: { userId: leadUser.id, role: "OWNER" } },
        },
      });
      await ensureRbacWorkspaceRole(leadUser.id, "OWNER");
      targetWorkspaceId = workspace.id;
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: parsed.data.planId } });
    if (!plan || !plan.isActive) {
      return { success: false, message: "Invalid or inactive subscription plan" };
    }

    const dailyRate = Number(plan.amount) / (plan.interval === "WEEKLY" ? 7 : plan.interval === "MONTHLY" ? 30 : 1);
    const dailyPrice = calculateDailyPrice(dailyRate, parsed.data.businessSize, qrOrderingEnabled);
    const { setupFee, qrPrintingFee, total: totalSetupFee } = calculateSetupFee(qrOrderingEnabled, modes);

    const result = await BusinessRegistrationEngine.register(
      {
        ...rest,
        workspaceId: targetWorkspaceId!,
        createdById,
        updatedById: leadId ? user.id : undefined,
        email: rest.email || undefined,
        phone: rest.phone || undefined,
        industry: industry as any,
        modes,
        planId: parsed.data.planId,
        businessSize: parsed.data.businessSize,
      },
      { id: plan.id, amount: Number(plan.amount), interval: plan.interval, name: plan.name },
      { dailyPrice, setupFee, qrPrintingFee, totalSetupFee },
    );

    if (!result.success) return { success: false, message: result.message };

    if (leadId) {
      await prisma.leadActivity.create({
        data: {
          leadId,
          action: "REGISTERED",
          detail: `Business "${rest.name}" registered with ${plan.name} plan at ${dailyPrice} TZS/day`,
          createdById: user.id,
        },
      });
      revalidatePath("/platform/sales-team/clients");
    } else {
      revalidatePath(`/workspaces/${targetWorkspaceId}`);
    }

    return {
      success: true,
      message: result.message,
      data: {
        businessId: result.data!.businessId,
        workspaceId: targetWorkspaceId,
        subscriptionId: result.data!.subscriptionId,
      },
    };
  } catch (error) {
    console.error("registerBusinessAction error:", error);
    return { success: false, message: "Failed to register business. Please try again." };
  }
}

export async function listActivePlansAction() {
  try {
    await requireAuth();
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { amount: "asc" },
    });
    return serialize(plans);
  } catch (error) {
    console.error("listActivePlansAction error:", error);
    return [];
  }
}

export async function updateBusinessAction(
  id: string,
  workspaceId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const user = await requireAuth();

    const parsed = updateBusinessSchema.safeParse({
      name: formData.get("name") || undefined,
      slug: formData.get("slug") || undefined,
      email: formData.get("email") || undefined,
      phone: formData.get("phone") || undefined,
      address: formData.get("address") || undefined,
      currency: formData.get("currency") || undefined,
      timezone: formData.get("timezone") || undefined,
      taxId: formData.get("taxId") || undefined,
      industry: formData.get("industry") || undefined,
      modes: formData.get("modes") ? JSON.parse(formData.get("modes") as string) : undefined,
    });

    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const result = await updateBusiness(id, parsed.data, user.id);

    if (result.success) {
      revalidatePath(`/workspaces/${workspaceId}`);
    }

    return result;
  } catch (error) {
    console.error("updateBusinessAction error:", error);
    return { success: false, message: "Failed to update business. Please try again." };
  }
}

export async function getBusinessAction(id: string) {
  try {
    await requireAuth();
    return getBusiness(id);
  } catch (error) {
    console.error("getBusinessAction error:", error);
    return null;
  }
}

export async function getWorkspaceBusinessesAction(workspaceId: string) {
  try {
    await requireAuth();
    return getWorkspaceBusinesses(workspaceId);
  } catch (error) {
    console.error("getWorkspaceBusinessesAction error:", error);
    return [];
  }
}

export async function deleteBusinessAction(businessId: string, workspaceId: string) {
  try {
    await requireAuth();
    const result = await deleteBusiness(businessId);
    if (result.success) {
      revalidatePath(`/workspaces/${workspaceId}`);
    }
    return result;
  } catch (error) {
    console.error("deleteBusinessAction error:", error);
    return { success: false, message: "Failed to delete business. Please try again." };
  }
}

export async function toggleQrOrderingAction(
  businessId: string,
  enable: boolean,
): Promise<ActionResponse & { data?: { dailyPrice: number; setupFee: number; qrPrintingFee: number } }> {
  await requireAuth();

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        modes: { select: { mode: true } },
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          include: { plan: true },
          take: 1,
        },
      },
    });

    if (!business) return { success: false, message: "Business not found" };
    if (business.subscriptions.length === 0) {
      return { success: false, message: "No active subscription found" };
    }

    const sub = business.subscriptions[0];
    if (!sub) return { success: false, message: "No active subscription found" };
    const plan = sub.plan;
    const businessSize = await getBusinessSetting(businessId, "business_size") ?? "small";
    const modes = business.modes.map((m) => m.mode);

    const dailyRate = Number(plan.amount) / (plan.interval === "WEEKLY" ? 7 : plan.interval === "MONTHLY" ? 30 : 1);
    const dailyPrice = calculateDailyPrice(dailyRate, businessSize, enable);
    const { setupFee, qrPrintingFee, total: totalSetupFee } = calculateSetupFee(enable, modes);

    await setBusinessSetting(businessId, "qr_ordering_enabled", enable ? "true" : "false", "boolean", "Whether QR ordering is enabled for this business");
    await setBusinessSetting(businessId, "daily_price", String(dailyPrice), "number", "Calculated daily subscription price");
    await setBusinessSetting(businessId, "setup_fee", String(totalSetupFee), "number", "One-time setup fee");

    if (enable && qrPrintingFee > 0) {
      await recordTransaction(businessId, {
        type: "deposit",
        amount: qrPrintingFee,
        reference: "QR_SETUP",
        description: `QR sticker printing ${QR_CODE_STICKER_COUNT} × ${QR_CODE_STICKER_PRICE} (${qrPrintingFee} TZS)`,
      });
    }

    revalidatePath(`/workspaces/businesses/${businessId}/qr-ordering`);
    revalidatePath(`/workspaces/businesses/${businessId}/subscriptions`);

    return {
      success: true,
      message: enable
        ? `QR ordering enabled. Daily price: ${dailyPrice} TZS/day. Setup fee: ${totalSetupFee} TZS.`
        : `QR ordering disabled. Daily price: ${dailyPrice} TZS/day.`,
      data: { dailyPrice, setupFee, qrPrintingFee },
    };
  } catch (error) {
    console.error("Toggle QR ordering error:", error);
    return { success: false, message: "Failed to update QR ordering setting" };
  }
}

export async function getBusinessPricingSettingsAction(businessId: string) {
  try {
    await requireAuth();
    const settings = await getBusinessSettingsMap(businessId);
    return {
      qrOrderingEnabled: settings.qr_ordering_enabled === "true",
      dailyPrice: settings.daily_price ? Number(settings.daily_price) : null,
      setupFee: settings.setup_fee ? Number(settings.setup_fee) : null,
      businessSize: settings.business_size ?? null,
    };
  } catch (error) {
    console.error("getBusinessPricingSettingsAction error:", error);
    return { qrOrderingEnabled: false, dailyPrice: null, setupFee: null, businessSize: null };
  }
}

export async function getBusinessesAction() {
  try {
    const user = await requireAuth();

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      select: { workspaceId: true },
    });
    if (!membership) return { workspaceId: null, businesses: [] };

    const businesses = await prisma.business.findMany({
      where: { workspaceId: membership.workspaceId },
      include: {
        _count: { select: { branches: true, staff: true, customers: true } },
        modes: { select: { industry: true, mode: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const statuses = await Promise.all(businesses.map((b) => syncBusinessStatus(b.id)));

    const data = businesses.map((biz, i) => ({
      ...biz,
      subscriptionStatus: statuses[i],
    }));
    return { workspaceId: membership.workspaceId, businesses: serialize(data) };
  } catch (error) {
    console.error("getBusinessesAction error:", error);
    return { workspaceId: null, businesses: [] };
  }
}
