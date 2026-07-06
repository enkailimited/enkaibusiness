import "server-only";

import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type { CreateRecurringConfigData, RecurringCommissionMetrics } from "../types";

export async function calculateRecurringCommission(
  salesProfileId: string,
  subscriptionId: string,
  paymentAmount: number,
): Promise<number> {
  try {
    const config = await prisma.recurringCommissionConfig.findFirst({
      where: {
        salesProfileId,
        subscriptionId,
        isActive: true,
      },
    });

    if (!config) return 0;

    return (paymentAmount * Number(config.percentage)) / 100;
  } catch (error) {
    console.error("Calculate recurring commission error:", error);
    return 0;
  }
}

export async function createRecurringConfig(
  data: CreateRecurringConfigData,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const existing = await prisma.recurringCommissionConfig.findUnique({
      where: {
        salesProfileId_subscriptionId_ruleId: {
          salesProfileId: data.salesProfileId,
          subscriptionId: data.subscriptionId,
          ruleId: data.ruleId,
        },
      },
    });

    if (existing) {
      if (!existing.isActive) {
        const config = await prisma.recurringCommissionConfig.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
        return {
          success: true,
          message: "Recurring commission config reactivated",
          data: { id: config.id },
        };
      }
      return {
        success: true,
        message: "Recurring commission config already exists",
        data: { id: existing.id },
      };
    }

    const config = await prisma.recurringCommissionConfig.create({
      data: {
        salesProfileId: data.salesProfileId,
        subscriptionId: data.subscriptionId,
        ruleId: data.ruleId,
        percentage: new Prisma.Decimal(data.percentage),
      },
    });

    return {
      success: true,
      message: "Recurring commission config created successfully",
      data: { id: config.id },
    };
  } catch (error) {
    console.error("Create recurring config error:", error);
    return { success: false, message: "Failed to create recurring commission config" };
  }
}

export async function processRecurringCommission(
  subscriptionId: string,
  paymentAmount: number,
  businessId?: string,
  userId?: string,
): Promise<ActionResponse & { data?: { entries: string[] } }> {
  try {
    const configs = await prisma.recurringCommissionConfig.findMany({
      where: {
        subscriptionId,
        isActive: true,
      },
      include: {
        salesProfile: { select: { userId: true } },
      },
    });

    if (configs.length === 0) {
      return { success: true, message: "No active recurring commission configs found" };
    }

    const entryIds: string[] = [];

    for (const config of configs) {
      const commissionAmount = (paymentAmount * Number(config.percentage)) / 100;
      if (commissionAmount <= 0) continue;

      const entry = await prisma.commissionLedger.create({
        data: {
          salesProfileId: config.salesProfileId,
          subscriptionId,
          amount: new Prisma.Decimal(commissionAmount),
          type: "PERCENTAGE",
          description: `Recurring commission (${config.percentage}%) on payment of ${paymentAmount}`,
        },
      });

      entryIds.push(entry.id);

      await prisma.recurringCommissionConfig.update({
        where: { id: config.id },
        data: {
          lastPaidDate: new Date(),
          totalPaid: { increment: new Prisma.Decimal(commissionAmount) },
          paidCount: { increment: 1 },
        },
      });

      if (businessId && userId) {
        const { emitCommissionEarned } = await import("@/modules/ai/events/event-bus");
        emitCommissionEarned(businessId, userId, entry.id, {
          amount: commissionAmount,
          subscriptionId,
          recurring: true,
          configId: config.id,
        });
      }
    }

    return {
      success: true,
      message: `Processed ${entryIds.length} recurring commission entries`,
      data: { entries: entryIds },
    };
  } catch (error) {
    console.error("Process recurring commission error:", error);
    return { success: false, message: "Failed to process recurring commissions" };
  }
}

export async function deactivateRecurringCommission(
  subscriptionId: string,
): Promise<ActionResponse> {
  try {
    const result = await prisma.recurringCommissionConfig.updateMany({
      where: { subscriptionId, isActive: true },
      data: { isActive: false },
    });

    return {
      success: true,
      message: `Deactivated ${result.count} recurring commission config(s)`,
    };
  } catch (error) {
    console.error("Deactivate recurring commission error:", error);
    return { success: false, message: "Failed to deactivate recurring commissions" };
  }
}

export async function getActiveRecurringCommissions(salesProfileId: string) {
  return prisma.recurringCommissionConfig.findMany({
    where: { salesProfileId, isActive: true },
    include: {
      subscription: {
        include: {
          plan: { select: { id: true, name: true, amount: true } },
          business: { select: { id: true, name: true } },
        },
      },
      rule: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRecurringCommissionMetrics(
  salesProfileId: string,
): Promise<RecurringCommissionMetrics> {
  const configs = await prisma.recurringCommissionConfig.findMany({
    where: { salesProfileId, isActive: true },
    select: {
      totalPaid: true,
      paidCount: true,
      percentage: true,
    },
  });

  const totalRecurringEarned = configs.reduce(
    (sum, c) => sum + Number(c.totalPaid),
    0,
  );
  const totalPaidCount = configs.reduce((sum, c) => sum + c.paidCount, 0);
  const activeConfigs = configs.length;
  const averagePerPayment = totalPaidCount > 0 ? totalRecurringEarned / totalPaidCount : 0;

  return {
    totalRecurringEarned,
    activeConfigs,
    totalPaidCount,
    averagePerPayment,
  };
}
