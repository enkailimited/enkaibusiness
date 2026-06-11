import "server-only";

import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type { EntryWithProfile, CommissionFilters, PendingPayout } from "../types";

const entryInclude = {
  include: {
    salesProfile: {
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    },
    payout: { select: { id: true, amount: true, paidAt: true } },
  },
} as const;

export async function createEntry(data: {
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

export async function getCommissionMetrics(salesProfileId?: string): Promise<{
  totalEarned: number;
  totalApproved: number;
  totalPaid: number;
  totalPending: number;
}> {
  const where = salesProfileId ? { salesProfileId } : {};

  const [totalEarned, totalApproved, totalPaid, totalPending] = await Promise.all([
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { ...where, status: { not: "CANCELLED" } },
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
