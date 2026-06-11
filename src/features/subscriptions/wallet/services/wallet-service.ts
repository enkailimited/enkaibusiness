import "server-only";

import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { ActionResponse } from "@/types/relationships";
import type {
  WalletWithTransactions,
  WalletInfo,
  TransactionListItem,
} from "../types";
import type { CreateWalletTransactionSchema } from "../schemas";

export async function getWallet(
  businessId: string,
): Promise<WalletWithTransactions> {
  let wallet = await prisma.subscriptionWallet.findUnique({
    where: { businessId },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!wallet) {
    wallet = await prisma.subscriptionWallet.create({
      data: { businessId },
      include: {
        transactions: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
  }

  return wallet as unknown as WalletWithTransactions;
}

export async function getWalletInfo(businessId: string): Promise<WalletInfo> {
  const wallet = await getWallet(businessId);

  return {
    id: wallet.id,
    businessId: wallet.businessId,
    balance: Number(wallet.balance),
    totalDeposited: Number(wallet.totalDeposited),
    totalConsumed: Number(wallet.totalConsumed),
    bonusBalance: Number(wallet.bonusBalance),
    recentTransactions: wallet.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      balanceBefore: Number(t.balanceBefore),
      balanceAfter: Number(t.balanceAfter),
      reference: t.reference,
      description: t.description,
      createdAt: t.createdAt,
    })),
  };
}

export async function recordTransaction(
  businessId: string,
  data: CreateWalletTransactionSchema,
): Promise<ActionResponse & { data?: { id: string; balanceAfter: number } }> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      let wallet = await tx.subscriptionWallet.findUnique({
        where: { businessId },
      });

      if (!wallet) {
        wallet = await tx.subscriptionWallet.create({
          data: { businessId },
        });
      }

      const balanceBefore = Number(wallet.balance);
      const amount = data.amount;
      let balanceAfter: number;
      const addsToBalance = ["deposit", "bonus", "refund"];
      const subtractsFromBalance = ["consumption", "adjustment", "expiry"];

      if (addsToBalance.includes(data.type)) {
        balanceAfter = balanceBefore + amount;
      } else if (subtractsFromBalance.includes(data.type)) {
        balanceAfter = balanceBefore - amount;
        if (balanceAfter < 0) balanceAfter = 0;
      } else {
        balanceAfter = balanceBefore;
      }

      const updateData: Record<string, unknown> = {
        balance: new Prisma.Decimal(balanceAfter),
      };

      if (data.type === "deposit") {
        updateData.totalDeposited = new Prisma.Decimal(
          Number(wallet.totalDeposited) + amount,
        );
      } else if (data.type === "consumption") {
        updateData.totalConsumed = new Prisma.Decimal(
          Number(wallet.totalConsumed) + amount,
        );
      } else if (data.type === "bonus") {
        updateData.bonusBalance = new Prisma.Decimal(
          Number(wallet.bonusBalance) + amount,
        );
      }

      await tx.subscriptionWallet.update({
        where: { businessId },
        data: updateData,
      });

      const transaction = await tx.subscriptionTransaction.create({
        data: {
          walletId: wallet.id,
          type: data.type,
          amount: new Prisma.Decimal(amount),
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(balanceAfter),
          reference: data.reference || null,
          description: data.description || null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        },
      });

      return { id: transaction.id, balanceAfter };
    });

    return {
      success: true,
      message: "Transaction recorded successfully",
      data: { id: result.id, balanceAfter: result.balanceAfter },
    };
  } catch (error) {
    console.error("Record wallet transaction error:", error);
    return {
      success: false,
      message: "Failed to record wallet transaction",
    };
  }
}

export async function addBonus(
  businessId: string,
  amount: number,
  description?: string,
  expiresAt?: Date,
): Promise<ActionResponse & { data?: { id: string; balanceAfter: number } }> {
  return recordTransaction(businessId, {
    type: "bonus",
    amount,
    description: description || "Bonus credit added",
    expiresAt,
  });
}

export async function getTransactions(
  businessId: string,
  pagination?: { page?: number; limit?: number },
): Promise<{
  data: TransactionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? 20;
  const skip = (page - 1) * limit;

  const wallet = await prisma.subscriptionWallet.findUnique({
    where: { businessId },
  });

  if (!wallet) {
    return { data: [], total: 0, page, limit, totalPages: 0 };
  }

  const [raw, total] = await Promise.all([
    prisma.subscriptionTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.subscriptionTransaction.count({
      where: { walletId: wallet.id },
    }),
  ]);

  return {
    data: raw.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      balanceBefore: Number(t.balanceBefore),
      balanceAfter: Number(t.balanceAfter),
      reference: t.reference,
      description: t.description,
      createdAt: t.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
