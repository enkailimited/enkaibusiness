import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateTransactionSchema, TransactionFilterSchema } from "../schemas";
import type { CashTransactionWithRegister } from "../types";
import { DEFAULT_PAGE_SIZE } from "../constants";

export async function recordTransaction(
  data: CreateTransactionSchema,
  performedById?: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const register = await tx.cashRegister.findUniqueOrThrow({
        where: { id: data.registerId },
      });

      const balanceBefore = register.currentBalance.toNumber();
      let balanceAfter: number;

      switch (data.type) {
        case "cash_in":
        case "transfer_in":
          balanceAfter = balanceBefore + data.amount;
          break;
        case "cash_out":
        case "transfer_out":
          balanceAfter = balanceBefore - data.amount;
          break;
        case "opening_balance":
          balanceAfter = data.amount;
          break;
        case "closing_balance":
        case "cash_count":
          balanceAfter = data.amount;
          break;
        default:
          throw new Error(`Invalid transaction type: ${data.type}`);
      }

      await tx.cashRegister.update({
        where: { id: data.registerId },
        data: { currentBalance: balanceAfter },
      });

      const transaction = await tx.cashTransaction.create({
        data: {
          registerId: data.registerId,
          type: data.type,
          amount: data.amount,
          balanceBefore,
          balanceAfter,
          reference: data.reference || null,
          description: data.description || null,
          performedById: performedById || null,
        },
      });

      return transaction;
    });

    return {
      success: true,
      message: "Transaction recorded successfully",
      data: { id: result.id },
    };
  } catch (error) {
    console.error("Record transaction error:", error);
    return { success: false, message: "Failed to record transaction" };
  }
}

export async function getRegisterTransactions(
  registerId: string,
  filter?: TransactionFilterSchema,
): Promise<{ data: CashTransactionWithRegister[]; total: number; totalPages: number }> {
  const page = filter?.page ?? 1;
  const limit = filter?.limit ?? DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { registerId };

  if (filter?.type) where.type = filter.type;

  if (filter?.dateFrom || filter?.dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (filter.dateFrom) dateFilter.gte = new Date(filter.dateFrom);
    if (filter.dateTo) dateFilter.lte = new Date(filter.dateTo);
    where.createdAt = dateFilter;
  }

  const [raw, total] = await Promise.all([
    prisma.cashTransaction.findMany({
      where,
      include: {
        performedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.cashTransaction.count({ where }),
  ]);

  const data = raw.map((t) => ({
    ...t,
    amount: t.amount.toNumber(),
    balanceBefore: t.balanceBefore.toNumber(),
    balanceAfter: t.balanceAfter.toNumber(),
    createdAt: t.createdAt.toISOString(),
  })) as CashTransactionWithRegister[];

  return {
    data,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getCashSummary(
  businessId: string,
): Promise<ActionResponse & { data?: { totals: Record<string, number>; grandTotal: number; registerCount: number } | null }> {
  try {
    const registers = await prisma.cashRegister.findMany({
      where: { businessId, isActive: true },
      select: {
        type: true,
        currentBalance: true,
      },
    });

    const totals: Record<string, number> = {};
    let grandTotal = 0;

    for (const reg of registers) {
      const amount = reg.currentBalance.toNumber();
      totals[reg.type] = (totals[reg.type] || 0) + amount;
      grandTotal += amount;
    }

    return {
      success: true,
      message: "Cash summary retrieved",
      data: {
        totals,
        grandTotal,
        registerCount: registers.length,
      },
    };
  } catch (error) {
    console.error("Cash summary error:", error);
    return { success: false, message: "Failed to get cash summary", data: null };
  }
}
