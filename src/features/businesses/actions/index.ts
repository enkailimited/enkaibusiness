"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { serialize } from "@/lib/utils";
import {
  updateBusiness,
  getBusiness,
  getWorkspaceBusinesses,
  deleteBusiness,
} from "../services/business-service";
import { createBusinessSchema, updateBusinessSchema } from "../schemas";
import { calculateDailyPrice, calculateSetupFee, QR_CODE_STICKER_COUNT, QR_CODE_STICKER_PRICE } from "@/features/subscriptions/constants/pricing";
import { setBusinessSetting } from "@/features/businesses/services/setting-service";
import type { ActionResponse } from "@/types/relationships";

export async function createBusinessAction(
  workspaceId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
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

  const business = await prisma.business.create({
    data: {
      ...businessData,
      workspaceId,
      createdById: user.id,
      updatedById: user.id,
      modes: {
        create: modes.map((mode) => ({
          industry,
          mode,
        })),
      },
    },
  });

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
      businessId: business.id,
      startDate: now,
      endDate,
      graceEndDate,
    },
  });

  await prisma.subscriptionWallet.create({
    data: {
      businessId: business.id,
      totalDeposited: totalSetupFee,
      balance: totalSetupFee,
    },
  });

  if (totalSetupFee > 0) {
    const wallet = await prisma.subscriptionWallet.findUnique({ where: { businessId: business.id } });
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

  await setBusinessSetting(business.id, "business_size", businessSize, "string", "Business size category");
  await setBusinessSetting(business.id, "daily_price", String(dailyPrice), "number", "Calculated daily subscription price");

  revalidatePath(`/workspaces/${workspaceId}`);

  return {
    success: true,
    message: `Business "${business.name}" created successfully with ${plan.name}`,
    data: { id: business.id, subscriptionId: subscription.id },
  };
}

export async function listActivePlansAction() {
  await requireAuth();
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { amount: "asc" },
  });
  return serialize(plans);
}

export async function updateBusinessAction(
  id: string,
  workspaceId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
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
}

export async function getBusinessAction(id: string) {
  await requireAuth();
  return getBusiness(id);
}

export async function getWorkspaceBusinessesAction(workspaceId: string) {
  await requireAuth();
  return getWorkspaceBusinesses(workspaceId);
}

export async function deleteBusinessAction(businessId: string, workspaceId: string) {
  await requireAuth();
  const result = await deleteBusiness(businessId);
  if (result.success) {
    revalidatePath(`/workspaces/${workspaceId}`);
  }
  return result;
}

export async function getBusinessesAction() {
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
  return { workspaceId: membership.workspaceId, businesses: serialize(businesses) };
}
