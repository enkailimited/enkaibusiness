import "server-only";
import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type { PayoutMethodType } from "@prisma/client";
import { emitCommissionPaid } from "@/modules/ai/events/event-bus";

export async function createBatchPayoutWithMethods(
  entries: { id: string; salesProfileId: string }[],
  methodId?: string,
  notes?: string,
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

    let payoutMethod: { id: string; type: string; label: string | null } | null = null;
    if (methodId) {
      const method = await prisma.payoutMethod.findUnique({ where: { id: methodId } });
      if (method) payoutMethod = method;
    }

    const payout = await prisma.commissionPayout.create({
      data: {
        amount: new Prisma.Decimal(totalAmount),
        notes: notes || null,
        entries: { connect: entryIds.map((id) => ({ id })) },
      },
    });

    const updateData: Record<string, unknown> = {
      status: "PAID",
      paidAt: new Date(),
      payoutId: payout.id,
    };
    if (payoutMethod) {
      updateData.payoutMethodId = payoutMethod.id;
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
          method: payoutMethod?.type,
        });
      }
    }

    return {
      success: true,
      message: `Batch payout of ${totalAmount} processed via ${payoutMethod?.type || "no method"}`,
      data: { id: payout.id },
    };
  } catch (error) {
    console.error("Batch payout with method error:", error);
    return { success: false, message: "Failed to process batch payout" };
  }
}

export async function processBulkPayout(
  payoutId: string,
  transactionRef: string,
): Promise<ActionResponse> {
  try {
    const payout = await prisma.commissionPayout.findUnique({
      where: { id: payoutId },
      include: { entries: { select: { id: true, salesProfileId: true } } },
    });

    if (!payout) return { success: false, message: "Payout not found" };

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

    for (const entry of payout.entries) {
      const profile = await prisma.salesProfile.findUnique({
        where: { id: entry.salesProfileId },
        select: { userId: true },
      });
      if (profile) {
        emitCommissionPaid("", profile.userId, payoutId, {
          transactionRef,
          entryId: entry.id,
        });
      }
    }

    return { success: true, message: "Bulk payout processed" };
  } catch (error) {
    console.error("Bulk payout error:", error);
    return { success: false, message: "Failed to process bulk payout" };
  }
}

export async function getPayoutHistory(salesProfileId: string) {
  const payouts = await prisma.commissionPayout.findMany({
    where: {
      entries: { some: { salesProfileId } },
    },
    include: {
      entries: {
        where: { salesProfileId },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalPayoutAmount = payouts.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    payouts,
    totalPayoutAmount,
    payoutCount: payouts.length,
    lastPayoutDate: payouts[0]?.paidAt ?? null,
  };
}

export async function getPayoutHistoryByMethod(methodType: PayoutMethodType) {
  const ledgerEntries = await prisma.commissionLedger.findMany({
    where: {
      status: "PAID",
      payoutMethod: { type: methodType },
    },
    include: {
      salesProfile: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
      payoutMethod: true,
      payout: true,
    },
    orderBy: { paidAt: "desc" },
  });

  const totalPaid = ledgerEntries.reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    entries: ledgerEntries,
    totalPaid,
    entryCount: ledgerEntries.length,
    methodType,
  };
}

export async function getPendingPayoutsSummary() {
  const pendingEntries = await prisma.commissionLedger.findMany({
    where: { status: "APPROVED", payoutId: null },
    include: {
      salesProfile: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          payoutMethods: {
            where: { isDefault: true },
            take: 1,
            select: { id: true, type: true, label: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const grouped = new Map<string, {
    salesProfileId: string;
    profileName: string;
    total: number;
    entryCount: number;
    defaultMethod: { id: string; type: string; label: string | null } | null;
  }>();

  for (const entry of pendingEntries) {
    const profileId = entry.salesProfileId;
    const existing = grouped.get(profileId);
    const method = entry.salesProfile.payoutMethods[0] || null;

    if (existing) {
      existing.total += Number(entry.amount);
      existing.entryCount += 1;
    } else {
      grouped.set(profileId, {
        salesProfileId: profileId,
        profileName: `${entry.salesProfile.user.firstName} ${entry.salesProfile.user.lastName}`,
        total: Number(entry.amount),
        entryCount: 1,
        defaultMethod: method,
      });
    }
  }

  const profiles = Array.from(grouped.values());
  const grandTotal = profiles.reduce((sum, p) => sum + p.total, 0);

  return {
    profiles,
    grandTotal,
    pendingProfileCount: profiles.length,
    totalPendingEntries: pendingEntries.length,
  };
}
