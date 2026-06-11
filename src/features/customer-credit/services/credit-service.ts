import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse, PaginatedResponse } from "@/types/relationships";
import type { CreateAccountSchema, UpdateAccountSchema, CreditTransactionSchema, AccountFilterSchema, TransactionFilterSchema } from "../schemas";
import type { CreditAccountWithCustomer, CreditTransactionWithDetails } from "../types";

function toCreditAccountWithCustomer(raw: Record<string, unknown>): CreditAccountWithCustomer {
  return {
    ...raw,
    creditLimit: Number((raw as Record<string, unknown>).creditLimit),
    currentBalance: Number((raw as Record<string, unknown>).currentBalance),
  } as unknown as CreditAccountWithCustomer;
}

function toTransactionWithDetails(raw: Record<string, unknown>): CreditTransactionWithDetails {
  return {
    ...raw,
    amount: Number((raw as Record<string, unknown>).amount),
    balanceBefore: Number((raw as Record<string, unknown>).balanceBefore),
    balanceAfter: Number((raw as Record<string, unknown>).balanceAfter),
  } as unknown as CreditTransactionWithDetails;
}

export async function createAccount(
  data: CreateAccountSchema,
  businessId: string,
  createdById: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
      select: { id: true, businessId: true },
    });

    if (!customer) {
      return { success: false, message: "Customer not found" };
    }

    if (customer.businessId !== businessId) {
      return { success: false, message: "Customer does not belong to this business" };
    }

    const existing = await prisma.customerCreditAccount.findUnique({
      where: { customerId: data.customerId },
    });

    if (existing) {
      return { success: false, message: "Customer already has a credit account" };
    }

    const account = await prisma.customerCreditAccount.create({
      data: {
        businessId,
        customerId: data.customerId,
        creditLimit: data.creditLimit,
        currentBalance: 0,
        status: "active",
      },
    });

    await prisma.customerCreditTransaction.create({
      data: {
        accountId: account.id,
        type: "adjustment",
        amount: 0,
        balanceBefore: 0,
        balanceAfter: 0,
        description: "Account created",
        createdById,
      },
    });

    return {
      success: true,
      message: "Credit account created successfully",
      data: { id: account.id },
    };
  } catch (error) {
    console.error("Create credit account error:", error);
    return { success: false, message: "Failed to create credit account" };
  }
}

export async function updateAccount(
  id: string,
  data: UpdateAccountSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const account = await prisma.customerCreditAccount.update({
      where: { id },
      data: {
        ...(data.creditLimit !== undefined && { creditLimit: data.creditLimit }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    return {
      success: true,
      message: "Credit account updated successfully",
      data: { id: account.id },
    };
  } catch (error) {
    console.error("Update credit account error:", error);
    return { success: false, message: "Failed to update credit account" };
  }
}

export async function getAccount(id: string): Promise<CreditAccountWithCustomer | null> {
  const raw = await prisma.customerCreditAccount.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      },
    },
  });

  if (!raw) return null;
  return toCreditAccountWithCustomer(raw as unknown as Record<string, unknown>);
}

export async function getAccounts(
  businessId: string,
  filter?: AccountFilterSchema,
): Promise<CreditAccountWithCustomer[]> {
  const where: Record<string, unknown> = { businessId };

  if (filter?.status) {
    where.status = filter.status;
  }

  if (filter?.customerId) {
    where.customerId = filter.customerId;
  }

  const raw = await prisma.customerCreditAccount.findMany({
    where,
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (raw as unknown as Record<string, unknown>[]).map(toCreditAccountWithCustomer);
}

export async function recordTransaction(
  data: CreditTransactionSchema,
  createdById: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.customerCreditAccount.findUnique({
        where: { id: data.accountId },
      });

      if (!account) {
        throw new Error("Account not found");
      }

      if (account.status !== "active") {
        throw new Error("Account is not active");
      }

      const balanceBefore = Number(account.currentBalance);
      const amount = data.type === "payment" || data.type === "refund"
        ? -Math.abs(data.amount)
        : data.amount;
      const balanceAfter = balanceBefore + amount;

      if (balanceAfter < 0) {
        throw new Error("Transaction would result in negative balance");
      }

      if (balanceAfter > Number(account.creditLimit) && (data.type === "credit_sale" || data.type === "adjustment")) {
        throw new Error("Transaction would exceed credit limit");
      }

      const transaction = await tx.customerCreditTransaction.create({
        data: {
          accountId: data.accountId,
          type: data.type,
          amount,
          balanceBefore,
          balanceAfter,
          reference: data.reference || null,
          description: data.description || null,
          createdById,
        },
      });

      await tx.customerCreditAccount.update({
        where: { id: data.accountId },
        data: {
          currentBalance: balanceAfter,
          lastTransactionAt: new Date(),
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
    const message = error instanceof Error ? error.message : "Failed to record transaction";
    return { success: false, message };
  }
}

export async function getTransactions(
  accountId: string,
  filter?: TransactionFilterSchema,
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<CreditTransactionWithDetails>> {
  const where: Record<string, unknown> = { accountId };

  if (filter?.type) {
    where.type = filter.type;
  }

  if (filter?.fromDate || filter?.toDate) {
    const createdAt: Record<string, Date> = {};
    if (filter?.fromDate) {
      createdAt.gte = new Date(filter.fromDate);
    }
    if (filter?.toDate) {
      createdAt.lte = new Date(filter.toDate);
    }
    where.createdAt = createdAt;
  }

  const [raw, total] = await Promise.all([
    prisma.customerCreditTransaction.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customerCreditTransaction.count({ where }),
  ]);

  return {
    data: (raw as unknown as Record<string, unknown>[]).map(toTransactionWithDetails),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
