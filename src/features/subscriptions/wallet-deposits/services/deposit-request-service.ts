import "server-only";

import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type { CreateDepositRequestSchema } from "../schemas";
import type { DepositRequestListItem } from "../types";

export async function createDepositRequest(
  businessId: string,
  userId: string,
  data: CreateDepositRequestSchema,
): Promise<ActionResponse> {
  try {
    await prisma.walletDepositRequest.create({
      data: {
        businessId,
        amount: new Prisma.Decimal(data.amount),
        reference: data.reference || null,
        description: data.description || null,
        requestedById: userId,
      },
    });

    return { success: true, message: "Deposit request submitted for approval" };
  } catch (error) {
    console.error("Create deposit request error:", error);
    return { success: false, message: "Failed to submit deposit request" };
  }
}

export async function approveDepositRequest(
  requestId: string,
  reviewerId: string,
): Promise<ActionResponse> {
  try {
    const request = await prisma.walletDepositRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) return { success: false, message: "Deposit request not found" };
    if (request.status !== "pending") {
      return { success: false, message: "Deposit request is already processed" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.walletDepositRequest.update({
        where: { id: requestId },
        data: { status: "approved", reviewedById: reviewerId, reviewedAt: new Date() },
      });

      let wallet = await tx.subscriptionWallet.findUnique({
        where: { businessId: request.businessId },
      });
      if (!wallet) {
        wallet = await tx.subscriptionWallet.create({
          data: { businessId: request.businessId },
        });
      }

      const balanceBefore = Number(wallet.balance);
      const amount = Number(request.amount);
      const balanceAfter = balanceBefore + amount;

      await tx.subscriptionWallet.update({
        where: { businessId: request.businessId },
        data: {
          balance: new Prisma.Decimal(balanceAfter),
          totalDeposited: new Prisma.Decimal(Number(wallet.totalDeposited) + amount),
        },
      });

      await tx.subscriptionTransaction.create({
        data: {
          walletId: wallet.id,
          type: "deposit",
          amount: new Prisma.Decimal(amount),
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(balanceAfter),
          reference: request.reference || "DEPOSIT",
          description: request.description || "Deposit approved",
        },
      });
    });

    return { success: true, message: "Deposit approved and wallet credited" };
  } catch (error) {
    console.error("Approve deposit error:", error);
    return { success: false, message: "Failed to approve deposit" };
  }
}

export async function rejectDepositRequest(
  requestId: string,
  reviewerId: string,
  notes?: string,
): Promise<ActionResponse> {
  try {
    const request = await prisma.walletDepositRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) return { success: false, message: "Deposit request not found" };
    if (request.status !== "pending") {
      return { success: false, message: "Deposit request is already processed" };
    }

    await prisma.walletDepositRequest.update({
      where: { id: requestId },
      data: { status: "rejected", reviewedById: reviewerId, reviewedAt: new Date(), notes },
    });

    return { success: true, message: "Deposit request rejected" };
  } catch (error) {
    console.error("Reject deposit error:", error);
    return { success: false, message: "Failed to reject deposit" };
  }
}

export async function listPendingDepositRequests(): Promise<DepositRequestListItem[]> {
  const requests = await prisma.walletDepositRequest.findMany({
    where: { status: "pending" },
    include: {
      business: { select: { id: true, name: true } },
      requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) => ({
    id: r.id,
    businessId: r.businessId,
    businessName: r.business.name,
    amount: Number(r.amount),
    reference: r.reference,
    description: r.description,
    status: r.status as "pending",
    requestedBy: {
      id: r.requestedBy.id,
      firstName: r.requestedBy.firstName,
      lastName: r.requestedBy.lastName,
      email: r.requestedBy.email,
    },
    reviewedBy: null,
    reviewedAt: null,
    notes: null,
    createdAt: r.createdAt,
  }));
}

export async function listDepositRequestsForBusiness(
  businessId: string,
): Promise<DepositRequestListItem[]> {
  const requests = await prisma.walletDepositRequest.findMany({
    where: { businessId },
    include: {
      business: { select: { id: true, name: true } },
      requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) => ({
    id: r.id,
    businessId: r.businessId,
    businessName: r.business.name,
    amount: Number(r.amount),
    reference: r.reference,
    description: r.description,
    status: r.status as "pending" | "approved" | "rejected",
    requestedBy: {
      id: r.requestedBy.id,
      firstName: r.requestedBy.firstName,
      lastName: r.requestedBy.lastName,
      email: r.requestedBy.email,
    },
    reviewedBy: r.reviewedBy
      ? { id: r.reviewedBy.id, firstName: r.reviewedBy.firstName, lastName: r.reviewedBy.lastName, email: r.reviewedBy.email }
      : null,
    reviewedAt: r.reviewedAt,
    notes: r.notes,
    createdAt: r.createdAt,
  }));
}
