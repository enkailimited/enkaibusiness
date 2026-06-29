import "server-only";

import type { Prisma } from "@prisma/client";

type PrismaTransactionClient = Prisma.TransactionClient;

export async function recordCashTransaction(
  tx: PrismaTransactionClient,
  businessId: string,
  branchId: string | null,
  type: "cash_in" | "cash_out",
  amount: number,
  reference: string,
  description: string,
): Promise<void> {
  const register = await tx.cashRegister.findFirst({
    where: {
      businessId,
      isActive: true,
      ...(branchId ? { branchId } : { branchId: null }),
    },
    orderBy: { createdAt: "asc" },
  });

  if (!register) return;

  const balanceBefore = register.currentBalance.toNumber();
  const balanceAfter = type === "cash_in" ? balanceBefore + amount : balanceBefore - amount;

  await tx.cashRegister.update({
    where: { id: register.id },
    data: { currentBalance: balanceAfter },
  });

  await tx.cashTransaction.create({
    data: {
      registerId: register.id,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      reference: reference || null,
      description: description || null,
    },
  });
}
