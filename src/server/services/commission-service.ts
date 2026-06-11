import "server-only";

import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type {
  CreateCommissionRuleSchema,
  UpdateCommissionRuleSchema,
  CreatePayoutSchema,
} from "@/lib/validations/commission";

export async function createRule(
  data: CreateCommissionRuleSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const rule = await prisma.commissionRule.create({
      data: {
        name: data.name,
        hierarchyLevelId: data.hierarchyLevelId || null,
        type: data.type,
        value: new Prisma.Decimal(data.value),
        minAmount: data.minAmount !== undefined ? new Prisma.Decimal(data.minAmount) : null,
        maxAmount: data.maxAmount !== undefined ? new Prisma.Decimal(data.maxAmount) : null,
      },
    });

    return {
      success: true,
      message: "Commission rule created successfully",
      data: { id: rule.id },
    };
  } catch (error) {
    console.error("Create commission rule error:", error);
    return { success: false, message: "Failed to create commission rule" };
  }
}

export async function getRules() {
  return prisma.commissionRule.findMany({
    include: { hierarchyLevel: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateRule(
  id: string,
  data: UpdateCommissionRuleSchema,
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.hierarchyLevelId !== undefined) updateData.hierarchyLevelId = data.hierarchyLevelId || null;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = new Prisma.Decimal(data.value);
    if (data.minAmount !== undefined) updateData.minAmount = new Prisma.Decimal(data.minAmount);
    if (data.maxAmount !== undefined) updateData.maxAmount = new Prisma.Decimal(data.maxAmount);

    await prisma.commissionRule.update({
      where: { id },
      data: updateData,
    });

    return { success: true, message: "Commission rule updated successfully" };
  } catch (error) {
    console.error("Update commission rule error:", error);
    return { success: false, message: "Failed to update commission rule" };
  }
}

export async function calculateCommission(
  salesProfileId: string,
  amount: number,
  subscriptionId?: string,
) {
  try {
    const profile = await prisma.salesProfile.findUnique({
      where: { id: salesProfileId },
      select: { hierarchyId: true },
    });

    if (!profile) return null;

    const rules = await prisma.commissionRule.findMany({
      where: {
        isActive: true,
        OR: [
          { hierarchyLevelId: profile.hierarchyId },
          { hierarchyLevelId: null },
        ],
      },
    });

    let totalCommission = 0;
    const breakdown: Array<{ ruleId: string; ruleName: string; amount: number }> = [];

    for (const rule of rules) {
      if (rule.minAmount && amount < Number(rule.minAmount)) continue;
      if (rule.maxAmount && amount > Number(rule.maxAmount)) continue;

      let commissionAmount = 0;

      if (rule.type === "FLAT") {
        commissionAmount = Number(rule.value);
      } else {
        commissionAmount = (amount * Number(rule.value)) / 100;
      }

      totalCommission += commissionAmount;
      breakdown.push({
        ruleId: rule.id,
        ruleName: rule.name,
        amount: commissionAmount,
      });
    }

    return { totalCommission, breakdown, subscriptionId };
  } catch (error) {
    console.error("Calculate commission error:", error);
    return null;
  }
}

export async function earnCommission(data: {
  salesProfileId: string;
  amount: number;
  type: "FLAT" | "PERCENTAGE";
  description?: string;
  subscriptionId?: string;
}): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const entry = await prisma.commissionLedger.create({
      data: {
        salesProfileId: data.salesProfileId,
        subscriptionId: data.subscriptionId || null,
        amount: new Prisma.Decimal(data.amount),
        type: data.type,
        description: data.description || null,
      },
    });

    return {
      success: true,
      message: "Commission entry created successfully",
      data: { id: entry.id },
    };
  } catch (error) {
    console.error("Earn commission error:", error);
    return { success: false, message: "Failed to create commission entry" };
  }
}

export async function getLedger(salesProfileId: string) {
  if (!salesProfileId || salesProfileId === "all") {
    return prisma.commissionLedger.findMany({
      include: { payout: true },
      orderBy: { createdAt: "desc" },
    });
  }

  return prisma.commissionLedger.findMany({
    where: { salesProfileId },
    include: { payout: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveCommission(ledgerId: string): Promise<ActionResponse> {
  try {
    const entry = await prisma.commissionLedger.findUnique({
      where: { id: ledgerId },
    });

    if (!entry) {
      return { success: false, message: "Commission entry not found" };
    }

    if (entry.status !== "PENDING") {
      return { success: false, message: "Only pending entries can be approved" };
    }

    await prisma.commissionLedger.update({
      where: { id: ledgerId },
      data: { status: "APPROVED" },
    });

    return { success: true, message: "Commission approved successfully" };
  } catch (error) {
    console.error("Approve commission error:", error);
    return { success: false, message: "Failed to approve commission" };
  }
}

export async function createPayout(
  data: CreatePayoutSchema,
  paidById: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const entries = await prisma.commissionLedger.findMany({
      where: {
        id: { in: data.entries },
        status: "APPROVED",
      },
    });

    if (entries.length !== data.entries.length) {
      return {
        success: false,
        message: "Some entries are not found or not approved",
      };
    }

    const payout = await prisma.commissionPayout.create({
      data: {
        amount: new Prisma.Decimal(data.amount),
        notes: data.notes || null,
        paidById,
        entries: {
          connect: data.entries.map((id) => ({ id })),
        },
      },
    });

    await prisma.commissionLedger.updateMany({
      where: { id: { in: data.entries } },
      data: {
        status: "PAID",
        paidAt: new Date(),
        payoutId: payout.id,
      },
    });

    return {
      success: true,
      message: "Payout created successfully",
      data: { id: payout.id },
    };
  } catch (error) {
    console.error("Create payout error:", error);
    return { success: false, message: "Failed to create payout" };
  }
}

export async function getPayouts() {
  return prisma.commissionPayout.findMany({
    include: {
      entries: {
        include: {
          salesProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      paidBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCommissionMetrics(salesProfileId?: string) {
  const whereClause: Prisma.CommissionLedgerWhereInput = {};
  
  if (salesProfileId && salesProfileId !== "all") {
    whereClause.salesProfileId = salesProfileId;
  }

  const [totalEarned, totalApproved, totalPaid, totalPending] = await Promise.all([
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { ...whereClause, status: { not: "CANCELLED" } },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { ...whereClause, status: "APPROVED" },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { ...whereClause, status: "PAID" },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { ...whereClause, status: "PENDING" },
    }),
  ]);

  return {
    totalEarned: Number(totalEarned._sum.amount) || 0,
    totalApproved: Number(totalApproved._sum.amount) || 0,
    totalPaid: Number(totalPaid._sum.amount) || 0,
    totalPending: Number(totalPending._sum.amount) || 0,
  };
}
