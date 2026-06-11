import "server-only";

import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type { CreatePayoutSchema } from "../schemas";
import type { PayoutWithEntries } from "../types";

export async function createPayout(
  data: CreatePayoutSchema,
  paidById: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const entries = await prisma.commissionLedger.findMany({
      where: { id: { in: data.entries }, status: "APPROVED" },
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
        entries: { connect: data.entries.map((id) => ({ id })) },
      },
    });

    await prisma.commissionLedger.updateMany({
      where: { id: { in: data.entries } },
      data: { status: "PAID", paidAt: new Date(), payoutId: payout.id },
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

export async function getPayouts(): Promise<PayoutWithEntries[]> {
  const payouts = await prisma.commissionPayout.findMany({
    include: {
      entries: {
        include: {
          salesProfile: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
      },
      paidBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return payouts as unknown as PayoutWithEntries[];
}

export async function getPayout(id: string): Promise<PayoutWithEntries | null> {
  const payout = await prisma.commissionPayout.findUnique({
    where: { id },
    include: {
      entries: {
        include: {
          salesProfile: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
      },
      paidBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return payout as unknown as PayoutWithEntries | null;
}
