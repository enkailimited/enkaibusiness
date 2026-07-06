import "server-only";

import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type { PendingPayout } from "../types";
import { emitCommissionPaid } from "@/modules/ai/events/event-bus";

export async function getPendingPayoutsV2(): Promise<(PendingPayout & { payoutMethod?: { id: string; type: string; label: string | null } | null })[]> {
  const pendingEntries = await prisma.commissionLedger.findMany({
    where: { status: "APPROVED", payoutId: null },
    include: {
      salesProfile: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          payoutMethods: {
            where: { isDefault: true },
            select: { id: true, type: true, label: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const grouped = new Map<string, PendingPayout & { payoutMethod?: { id: string; type: string; label: string | null } | null }>();

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
        payoutMethod: entry.salesProfile.payoutMethods[0] || null,
      });
    }
  }

  return Array.from(grouped.values());
}

export async function createBatchPayout(
  entries: { id: string; salesProfileId: string }[],
  method?: { id: string; type: string },
  notes?: string,
  paidById?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const entryIds = entries.map((e) => e.id);
    const ledgerEntries = await prisma.commissionLedger.findMany({
      where: { id: { in: entryIds }, status: "APPROVED" },
    });

    if (ledgerEntries.length !== entryIds.length) {
      return { success: false, message: "Some entries are not found or not approved" };
    }

    const totalAmount = ledgerEntries.reduce((sum, e) => sum + Number(e.amount), 0);

    const payout = await prisma.commissionPayout.create({
      data: {
        amount: new Prisma.Decimal(totalAmount),
        notes: notes || null,
        paidById: paidById || null,
        entries: { connect: entryIds.map((id) => ({ id })) },
      },
    });

    const updateData: Record<string, unknown> = {
      status: "PAID",
      paidAt: new Date(),
      payoutId: payout.id,
    };
    if (method) {
      updateData.payoutMethodId = method.id;
      updateData.paymentReference = `Payout-${payout.id}`;
    }

    await prisma.commissionLedger.updateMany({
      where: { id: { in: entryIds } },
      data: updateData as any,
    });

    for (const entry of ledgerEntries) {
      const profile = await prisma.salesProfile.findUnique({
        where: { id: entry.salesProfileId },
        select: { userId: true },
      });
      if (profile) {
        emitCommissionPaid("", profile.userId, payout.id, {
          amount: Number(entry.amount),
          entryId: entry.id,
          method: method?.type,
        });
      }
    }

    return {
      success: true,
      message: `Batch payout of ${totalAmount} processed successfully`,
      data: { id: payout.id },
    };
  } catch (error) {
    console.error("Batch payout error:", error);
    return { success: false, message: "Failed to process batch payout" };
  }
}

export async function processPayoutApproval(
  payoutId: string,
  approvedBy: string,
): Promise<ActionResponse> {
  try {
    const payout = await prisma.commissionPayout.findUnique({
      where: { id: payoutId },
      include: { entries: { select: { id: true } } },
    });

    if (!payout) {
      return { success: false, message: "Payout not found" };
    }

    await prisma.commissionPayout.update({
      where: { id: payoutId },
      data: { paidById: approvedBy },
    });

    return { success: true, message: "Payout approved successfully" };
  } catch (error) {
    console.error("Payout approval error:", error);
    return { success: false, message: "Failed to approve payout" };
  }
}

export async function processPayoutPaid(
  payoutId: string,
  transactionRef: string,
): Promise<ActionResponse> {
  try {
    const payout = await prisma.commissionPayout.findUnique({
      where: { id: payoutId },
      include: { entries: { select: { id: true, salesProfileId: true } } },
    });

    if (!payout) {
      return { success: false, message: "Payout not found" };
    }

    const entryIds = payout.entries.map((e) => e.id);

    await prisma.commissionLedger.updateMany({
      where: { id: { in: entryIds } },
      data: {
        paymentReference: transactionRef,
        paidAt: new Date(),
      },
    });

    await prisma.commissionPayout.update({
      where: { id: payoutId },
      data: { paidAt: new Date() },
    });

    return { success: true, message: "Payout marked as paid" };
  } catch (error) {
    console.error("Payout paid error:", error);
    return { success: false, message: "Failed to mark payout as paid" };
  }
}
