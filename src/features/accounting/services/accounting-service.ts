import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";

export interface ChartAccountInput {
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
  parentId?: string;
  description?: string;
}

export interface JournalLineInput {
  chartAccountId: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntryInput {
  workspaceId: string;
  businessId: string;
  entryDate?: Date;
  reference?: string;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  lines: JournalLineInput[];
  createdById?: string;
}

export interface AccountBalance {
  accountId: string;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

export async function createChartAccount(
  businessId: string,
  input: ChartAccountInput,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const existing = await prisma.chartAccount.findUnique({
      where: { businessId_code: { businessId, code: input.code } },
    });
    if (existing) return { success: false, message: `Account code "${input.code}" already exists` };

    const account = await prisma.chartAccount.create({
      data: {
        businessId,
        code: input.code,
        name: input.name,
        type: input.type,
        parentId: input.parentId || null,
        description: input.description || null,
      },
    });

    return { success: true, message: "Account created", data: { id: account.id } };
  } catch (error) {
    console.error("Create account error:", error);
    return { success: false, message: "Failed to create account" };
  }
}

export async function updateChartAccount(
  id: string,
  input: Partial<ChartAccountInput>,
): Promise<ActionResponse> {
  try {
    await prisma.chartAccount.update({ where: { id }, data: input });
    return { success: true, message: "Account updated" };
  } catch (error) {
    console.error("Update account error:", error);
    return { success: false, message: "Failed to update account" };
  }
}

export async function getChartAccount(id: string) {
  return prisma.chartAccount.findUnique({
    where: { id },
    include: { children: { where: { isActive: true } } },
  });
}

export async function listChartAccounts(businessId: string) {
  return prisma.chartAccount.findMany({
    where: { businessId, isActive: true },
    orderBy: { code: "asc" },
  });
}

export async function postJournalEntry(
  input: JournalEntryInput,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const { lines, ...entryData } = input;

    if (lines.length < 2) return { success: false, message: "Journal entry must have at least 2 lines" };

    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return { success: false, message: `Debit (${totalDebit}) must equal Credit (${totalCredit})` };
    }

    const reference = input.reference || `JE-${Date.now().toString(36).toUpperCase()}`;

    const entry = await prisma.journalEntry.create({
      data: {
        ...entryData,
        reference,
        entryDate: input.entryDate || new Date(),
        isPosted: true,
        lines: {
          create: lines.map((line) => ({
            chartAccountId: line.chartAccountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description || null,
          })),
        },
      },
      include: { lines: true },
    });

    return { success: true, message: "Journal entry posted", data: { id: entry.id } };
  } catch (error) {
    console.error("Post journal entry error:", error);
    return { success: false, message: "Failed to post journal entry" };
  }
}

export async function getJournalEntry(id: string) {
  return prisma.journalEntry.findUnique({
    where: { id },
    include: {
      lines: {
        include: { chartAccount: { select: { id: true, code: true, name: true, type: true } } },
      },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function listJournalEntries(
  businessId: string,
  filter?: {
    accountId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    referenceType?: string;
    limit?: number;
  },
) {
  const where: Record<string, unknown> = { businessId };

  if (filter?.referenceType) where.referenceType = filter.referenceType;
  if (filter?.dateFrom || filter?.dateTo) {
    where.entryDate = {};
    if (filter.dateFrom) (where.entryDate as Record<string, unknown>).gte = filter.dateFrom;
    if (filter.dateTo) (where.entryDate as Record<string, unknown>).lte = filter.dateTo;
  }

  if (filter?.accountId) {
    where.lines = { some: { chartAccountId: filter.accountId } };
  }

  return prisma.journalEntry.findMany({
    where: where as Parameters<typeof prisma.journalEntry.findMany>[0]["where"],
    include: { lines: true, createdBy: { select: { id: true, name: true } } },
    orderBy: { entryDate: "desc" },
    take: filter?.limit || 100,
  });
}

export async function getTrialBalance(
  businessId: string,
  asOf?: Date,
): Promise<AccountBalance[]> {
  const dateFilter = asOf ? { lte: asOf } : undefined;

  const accounts = await prisma.chartAccount.findMany({
    where: { businessId, isActive: true },
    orderBy: { code: "asc" },
  });

  const balances: AccountBalance[] = [];

  for (const account of accounts) {
    const lines = await prisma.journalLine.findMany({
      where: {
        chartAccountId: account.id,
        journalEntry: {
          businessId,
          isPosted: true,
          ...(dateFilter ? { entryDate: dateFilter } : {}),
        },
      },
    });

    const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit), 0);
    const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit), 0);

    let balance: number;
    switch (account.type) {
      case "asset":
      case "expense":
        balance = totalDebit - totalCredit;
        break;
      case "liability":
      case "equity":
      case "income":
        balance = totalCredit - totalDebit;
        break;
      default:
        balance = totalDebit - totalCredit;
    }

    balances.push({
      accountId: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      debit: totalDebit,
      credit: totalCredit,
      balance,
    });
  }

  return balances;
}

export async function getIncomeStatement(
  businessId: string,
  dateFrom: Date,
  dateTo: Date,
): Promise<{ revenue: AccountBalance[]; expenses: AccountBalance[]; netIncome: number }> {
  const allBalances = await getTrialBalance(businessId, dateTo);

  const revenue = allBalances.filter((a) => a.type === "income");
  const expenses = allBalances.filter((a) => a.type === "expense");

  const totalRevenue = revenue.reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = expenses.reduce((sum, a) => sum + a.balance, 0);

  return { revenue, expenses, netIncome: totalRevenue - totalExpenses };
}

export async function getBalanceSheet(
  businessId: string,
  asOf?: Date,
): Promise<{ assets: AccountBalance[]; liabilities: AccountBalance[]; equity: AccountBalance[] }> {
  const allBalances = await getTrialBalance(businessId, asOf);

  return {
    assets: allBalances.filter((a) => a.type === "asset"),
    liabilities: allBalances.filter((a) => a.type === "liability"),
    equity: allBalances.filter((a) => a.type === "equity"),
  };
}

export async function deleteJournalEntry(id: string): Promise<ActionResponse> {
  try {
    await prisma.journalEntry.delete({ where: { id } });
    return { success: true, message: "Journal entry deleted" };
  } catch (error) {
    console.error("Delete journal entry error:", error);
    return { success: false, message: "Failed to delete journal entry" };
  }
}
