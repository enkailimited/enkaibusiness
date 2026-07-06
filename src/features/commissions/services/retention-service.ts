import "server-only";

import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type { CreateRetentionBonusConfigData, UpdateRetentionBonusConfigData } from "../types";

export async function getRetentionBonusConfigs() {
  return prisma.retentionBonusConfig.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createRetentionBonusConfig(
  data: CreateRetentionBonusConfigData,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const config = await prisma.retentionBonusConfig.create({
      data: {
        name: data.name,
        description: data.description || null,
        triggerType: data.triggerType,
        triggerValue: data.triggerValue ?? null,
        bonusType: data.bonusType,
        bonusValue: new Prisma.Decimal(data.bonusValue),
        formula: data.formula || null,
      },
    });

    return {
      success: true,
      message: "Retention bonus config created successfully",
      data: { id: config.id },
    };
  } catch (error) {
    console.error("Create retention config error:", error);
    return { success: false, message: "Failed to create retention bonus config" };
  }
}

export async function updateRetentionBonusConfig(
  id: string,
  data: UpdateRetentionBonusConfigData,
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.triggerType !== undefined) updateData.triggerType = data.triggerType;
    if (data.triggerValue !== undefined) updateData.triggerValue = data.triggerValue ?? null;
    if (data.bonusType !== undefined) updateData.bonusType = data.bonusType;
    if (data.bonusValue !== undefined) updateData.bonusValue = new Prisma.Decimal(data.bonusValue);
    if (data.formula !== undefined) updateData.formula = data.formula || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.retentionBonusConfig.update({
      where: { id },
      data: updateData,
    });

    return { success: true, message: "Retention bonus config updated successfully" };
  } catch (error) {
    console.error("Update retention config error:", error);
    return { success: false, message: "Failed to update retention bonus config" };
  }
}

export async function checkAndAwardBonuses(
  salesProfileId: string,
  businessId: string,
): Promise<ActionResponse & { data?: { awarded: number; totalAmount: number } }> {
  try {
    const configs = await prisma.retentionBonusConfig.findMany({
      where: { isActive: true },
    });

    if (configs.length === 0) {
      return { success: true, message: "No retention bonus configs found", data: { awarded: 0, totalAmount: 0 } };
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { createdAt: true },
    });

    if (!business) {
      return { success: false, message: "Business not found" };
    }

    const monthsSinceCreated = Math.floor(
      (Date.now() - new Date(business.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30.44),
    );

    const activeSubscriptionCount = await prisma.subscription.count({
      where: { businessId, status: "ACTIVE" },
    });

    const totalPayments = await prisma.subscriptionPayment.aggregate({
      _sum: { amount: true },
      where: { subscription: { businessId } },
    });

    const totalPaid = Number(totalPayments._sum.amount) || 0;

    let awarded = 0;
    let totalAmount = 0;

    for (const config of configs) {
      const existingBonus = await prisma.retentionBonusEarned.findFirst({
        where: {
          configId: config.id,
          salesProfileId,
          businessId,
        },
      });

      if (existingBonus) continue;

      let qualifies = false;
      let bonusAmount = 0;

      switch (config.triggerType) {
        case "MONTHS_ACTIVE": {
          if (config.triggerValue && monthsSinceCreated >= config.triggerValue) {
            qualifies = true;
          }
          break;
        }
        case "TOTAL_PAYMENTS": {
          if (config.triggerValue && totalPaid >= config.triggerValue) {
            qualifies = true;
          }
          break;
        }
        case "ACTIVE_SUBSCRIPTIONS": {
          if (config.triggerValue && activeSubscriptionCount >= config.triggerValue) {
            qualifies = true;
          }
          break;
        }
        case "ALWAYS": {
          qualifies = true;
          break;
        }
      }

      if (!qualifies) continue;

      if (config.bonusType === "FIXED") {
        bonusAmount = Number(config.bonusValue);
      } else if (config.bonusType === "PERCENTAGE" && config.formula) {
        const percentage = Number(config.bonusValue);
        bonusAmount = (totalPaid * percentage) / 100;
      } else if (config.bonusType === "FORMULA" && config.formula) {
        const context = { totalPaid, monthsSinceCreated, activeSubscriptionCount };
        let expr = config.formula;
        for (const [key, value] of Object.entries(context)) {
          expr = expr.replace(new RegExp(`\\b${key}\\b`, "g"), String(value));
        }
        const allowed = /^[\d\s+\-*/().,]+$/;
        if (allowed.test(expr)) {
          try {
            bonusAmount = Math.max(0, Function(`"use strict"; return (${expr});`)());
          } catch {
            bonusAmount = 0;
          }
        }
      }

      if (bonusAmount <= 0) continue;

      await prisma.retentionBonusEarned.create({
        data: {
          configId: config.id,
          salesProfileId,
          businessId,
          amount: new Prisma.Decimal(bonusAmount),
          description: `Retention bonus: ${config.name}`,
        },
      });

      awarded++;
      totalAmount += bonusAmount;
    }

    if (awarded > 0) {
      await prisma.commissionLedger.create({
        data: {
          salesProfileId,
          amount: new Prisma.Decimal(totalAmount),
          type: "FLAT",
          description: `Retention bonus (${awarded} config(s)) for business ${businessId}`,
        },
      });
    }

    return {
      success: true,
      message: `Awarded ${awarded} retention bonus(es) totaling ${totalAmount}`,
      data: { awarded, totalAmount },
    };
  } catch (error) {
    console.error("Check and award bonuses error:", error);
    return { success: false, message: "Failed to check and award bonuses" };
  }
}

export async function processRetentionMilestones(
  salesProfileId: string,
  businessId: string,
): Promise<ActionResponse & { data?: { awarded: number; totalAmount: number } }> {
  return checkAndAwardBonuses(salesProfileId, businessId);
}
