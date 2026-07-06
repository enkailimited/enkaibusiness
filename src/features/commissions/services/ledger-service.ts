import "server-only";

import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type { CreateEntryData, AdjustmentData, CommissionFilters, EntryWithProfile, PendingPayout, CommissionMetrics } from "../types";
import { emitCommissionEarned } from "@/modules/ai/events/event-bus";

const entryInclude = {
  include: {
    salesProfile: {
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    },
    payout: { select: { id: true, amount: true, paidAt: true } },
    payoutMethod: { select: { id: true, type: true, label: true } },
  },
} as const;

export async function createEntry(
  data: CreateEntryData,
  businessId?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const entry = await prisma.commissionLedger.create({
      data: {
        salesProfileId: data.salesProfileId,
        subscriptionId: data.subscriptionId || null,
        amount: new Prisma.Decimal(data.amount),
        type: data.type,
        description: data.description || null,
        payoutMethodId: data.payoutMethodId || null,
        paymentReference: data.paymentReference || null,
        adjustedById: data.adjustedById || null,
        adjustmentReason: data.adjustmentReason || null,
      },
    });

    if (businessId) {
      const profile = await prisma.salesProfile.findUnique({
        where: { id: data.salesProfileId },
        select: { userId: true },
      });
      if (profile) {
        emitCommissionEarned(businessId, profile.userId, entry.id, {
          amount: data.amount,
          subscriptionId: data.subscriptionId,
          description: data.description,
          type: data.type,
        });
      }
    }

    return {
      success: true,
      message: "Commission entry created successfully",
      data: { id: entry.id },
    };
  } catch (error) {
    console.error("Create entry error:", error);
    return { success: false, message: "Failed to create commission entry" };
  }
}

export async function getEntries(
  filters?: CommissionFilters,
): Promise<EntryWithProfile[]> {
  const where: Record<string, unknown> = {};

  if (filters?.salesProfileId) where.salesProfileId = filters.salesProfileId;
  if (filters?.status) where.status = filters.status;
  if (filters?.type) where.type = filters.type;

  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) (where.createdAt as Record<string, unknown>).gte = filters.dateFrom;
    if (filters.dateTo) (where.createdAt as Record<string, unknown>).lte = filters.dateTo;
  }

  const entries = await prisma.commissionLedger.findMany({
    where,
    ...entryInclude,
    orderBy: { createdAt: "desc" },
  });

  return entries as unknown as EntryWithProfile[];
}

export async function getEntriesByProfile(
  salesProfileId: string,
  status?: string,
): Promise<EntryWithProfile[]> {
  const where: Record<string, unknown> = { salesProfileId };
  if (status) where.status = status;

  const entries = await prisma.commissionLedger.findMany({
    where,
    ...entryInclude,
    orderBy: { createdAt: "desc" },
  });

  return entries as unknown as EntryWithProfile[];
}

export async function approveEntry(ledgerId: string): Promise<ActionResponse> {
  try {
    const entry = await prisma.commissionLedger.findUnique({ where: { id: ledgerId } });

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
    console.error("Approve entry error:", error);
    return { success: false, message: "Failed to approve commission" };
  }
}

export async function rejectEntry(
  ledgerId: string,
  reason: string,
): Promise<ActionResponse> {
  try {
    const entry = await prisma.commissionLedger.findUnique({ where: { id: ledgerId } });

    if (!entry) {
      return { success: false, message: "Commission entry not found" };
    }

    if (entry.status !== "PENDING") {
      return { success: false, message: "Only pending entries can be rejected" };
    }

    await prisma.commissionLedger.update({
      where: { id: ledgerId },
      data: {
        status: "REJECTED",
        description: entry.description
          ? `${entry.description} | Rejected: ${reason}`
          : `Rejected: ${reason}`,
      },
    });

    return { success: true, message: "Commission entry rejected" };
  } catch (error) {
    console.error("Reject entry error:", error);
    return { success: false, message: "Failed to reject commission entry" };
  }
}

export async function partialPayEntry(
  ledgerId: string,
  amount: number,
  businessId?: string,
): Promise<ActionResponse & { data?: { originalId: string; partialId: string } }> {
  try {
    const entry = await prisma.commissionLedger.findUnique({ where: { id: ledgerId } });

    if (!entry) {
      return { success: false, message: "Commission entry not found" };
    }

    if (entry.status !== "APPROVED") {
      return { success: false, message: "Only approved entries can be partially paid" };
    }

    const originalAmount = Number(entry.amount);
    if (amount >= originalAmount) {
      return { success: false, message: "Partial amount must be less than total. Use full payout instead." };
    }

    const remaining = originalAmount - amount;

    const [partialEntry] = await Promise.all([
      prisma.commissionLedger.create({
        data: {
          salesProfileId: entry.salesProfileId,
          subscriptionId: entry.subscriptionId,
          amount: new Prisma.Decimal(remaining),
          type: entry.type,
          description: `Remaining balance from entry ${ledgerId}`,
          status: "PARTIAL",
        },
      }),
      prisma.commissionLedger.update({
        where: { id: ledgerId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      }),
    ]);

    if (businessId) {
      const profile = await prisma.salesProfile.findUnique({
        where: { id: entry.salesProfileId },
        select: { userId: true },
      });
      if (profile) {
        emitCommissionEarned(businessId, profile.userId, partialEntry.id, {
          amount: remaining,
          originalEntryId: ledgerId,
          description: "Partial payment remaining",
        });
      }
    }

    return {
      success: true,
      message: "Partial payment processed successfully",
      data: { originalId: ledgerId, partialId: partialEntry.id },
    };
  } catch (error) {
    console.error("Partial pay entry error:", error);
    return { success: false, message: "Failed to process partial payment" };
  }
}

export async function adjustEntry(
  ledgerId: string,
  adjustment: AdjustmentData,
  businessId?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const original = await prisma.commissionLedger.findUnique({ where: { id: ledgerId } });
    if (!original) {
      return { success: false, message: "Original commission entry not found" };
    }

    const entry = await prisma.commissionLedger.create({
      data: {
        salesProfileId: original.salesProfileId,
        subscriptionId: original.subscriptionId,
        amount: new Prisma.Decimal(adjustment.amount),
        type: original.type,
        description: `Adjustment: ${adjustment.reason} (original: ${ledgerId})`,
        status: "ADJUSTMENT",
        adjustedById: adjustment.adjustedById,
        adjustmentReason: adjustment.reason,
      },
    });

    if (businessId) {
      const profile = await prisma.salesProfile.findUnique({
        where: { id: original.salesProfileId },
        select: { userId: true },
      });
      if (profile) {
        emitCommissionEarned(businessId, profile.userId, entry.id, {
          amount: adjustment.amount,
          adjustment: true,
          originalEntryId: ledgerId,
          reason: adjustment.reason,
        });
      }
    }

    return {
      success: true,
      message: "Adjustment entry created successfully",
      data: { id: entry.id },
    };
  } catch (error) {
    console.error("Adjust entry error:", error);
    return { success: false, message: "Failed to create adjustment entry" };
  }
}

export async function manualEntry(
  data: CreateEntryData,
): Promise<ActionResponse & { data?: { id: string } }> {
  return createEntry({
    ...data,
    description: data.description ? `Manual: ${data.description}` : "Manual entry",
  });
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
      breakdown.push({ ruleId: rule.id, ruleName: rule.name, amount: commissionAmount });
    }

    return { totalCommission, breakdown, subscriptionId };
  } catch (error) {
    console.error("Calculate commission error:", error);
    return null;
  }
}

export async function getPendingPayouts(): Promise<PendingPayout[]> {
  const pendingEntries = await prisma.commissionLedger.findMany({
    where: { status: "APPROVED", payoutId: null },
    include: {
      salesProfile: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const grouped = new Map<string, PendingPayout>();

  for (const entry of pendingEntries) {
    const profileId = entry.salesProfileId;
    const existing = grouped.get(profileId);

    const entryData = {
      id: entry.id,
      amount: Number(entry.amount),
      type: entry.type,
      description: entry.description || undefined,
    };

    if (existing) {
      existing.total += Number(entry.amount);
      existing.entries.push(entryData);
    } else {
      grouped.set(profileId, {
        salesProfileId: profileId,
        profileName: `${entry.salesProfile.user.firstName} ${entry.salesProfile.user.lastName}`,
        total: Number(entry.amount),
        entries: [entryData],
      });
    }
  }

  return Array.from(grouped.values());
}

export async function cancelEntry(ledgerId: string, reason?: string): Promise<ActionResponse> {
  try {
    const entry = await prisma.commissionLedger.findUnique({ where: { id: ledgerId } });
    if (!entry) return { success: false, message: "Commission entry not found" };
    if (entry.status === "PAID") return { success: false, message: "Cannot cancel a paid entry; create a clawback instead" };
    if (entry.status === "CANCELLED") return { success: false, message: "Entry is already cancelled" };

    await prisma.commissionLedger.update({
      where: { id: ledgerId },
      data: { status: "CANCELLED", description: reason ? `${entry.description || ""} | Cancelled: ${reason}` : entry.description },
    });

    return { success: true, message: "Commission entry cancelled" };
  } catch (error) {
    console.error("Cancel entry error:", error);
    return { success: false, message: "Failed to cancel commission entry" };
  }
}

export async function clawbackEntry(
  originalEntryId: string,
  salesProfileId: string,
  amount: number,
  reason: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const negativeAmount = -Math.abs(amount);
    const entry = await prisma.commissionLedger.create({
      data: {
        salesProfileId,
        amount: new Prisma.Decimal(negativeAmount),
        type: "FLAT",
        description: `Clawback: ${reason} (original entry: ${originalEntryId})`,
        status: "CLAWBACK",
      },
    });

    await prisma.commissionLedger.update({
      where: { id: originalEntryId },
      data: { description: `${reason} | Clawed back` },
    });

    return { success: true, message: "Clawback entry created", data: { id: entry.id } };
  } catch (error) {
    console.error("Clawback error:", error);
    return { success: false, message: "Failed to create clawback" };
  }
}

export async function getCommissionMetrics(salesProfileId?: string): Promise<CommissionMetrics> {
  const where = salesProfileId ? { salesProfileId } : {};

  const [totalEarned, totalApproved, totalPaid, totalPending] = await Promise.all([
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { ...where, status: { notIn: ["CANCELLED", "REJECTED"] } },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { ...where, status: "APPROVED" },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { ...where, status: "PAID" },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { ...where, status: "PENDING" },
    }),
  ]);

  return {
    totalEarned: Number(totalEarned._sum.amount) || 0,
    totalApproved: Number(totalApproved._sum.amount) || 0,
    totalPaid: Number(totalPaid._sum.amount) || 0,
    totalPending: Number(totalPending._sum.amount) || 0,
  };
}
