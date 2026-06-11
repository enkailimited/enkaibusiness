import "server-only";

import { prisma } from "@/server/db";
import type { DateRange, ExpensesReport, TrendPoint, CategorySpend } from "../types";

function buildDateFilter(dateRange?: DateRange): Record<string, Date> | undefined {
  if (!dateRange) return undefined;
  const filter: Record<string, Date> = {};
  if (dateRange.startDate) filter.gte = new Date(dateRange.startDate);
  if (dateRange.endDate) filter.lte = new Date(dateRange.endDate);
  return Object.keys(filter).length ? filter : undefined;
}

export async function getExpenseSummary(
  businessId: string,
  dateRange?: DateRange,
): Promise<ExpensesReport> {
  const dateFilter = buildDateFilter(dateRange);
  const where: Record<string, unknown> = { businessId, status: { in: ["approved", "paid"] } };
  if (dateFilter) where.expenseDate = dateFilter;

  const [aggregation, categoryData, trendData] = await Promise.all([
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true },
      _min: { amount: true },
      _max: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where,
      _count: true,
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
    prisma.expense.findMany({
      where,
      select: { expenseDate: true, amount: true },
      orderBy: { expenseDate: "asc" },
    }),
  ]);

  const categoryIds = categoryData.map((c) => c.categoryId);
  const categoryMap = new Map<string, string>();
  if (categoryIds.length > 0) {
    const categories = await prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    for (const c of categories) {
      categoryMap.set(c.id, c.name);
    }
  }

  const trendMap = new Map<string, number>();
  for (const e of trendData) {
    const key = e.expenseDate.toISOString().slice(0, 10);
    trendMap.set(key, (trendMap.get(key) ?? 0) + Number(e.amount));
  }

  const total = Number(aggregation._sum.amount) || 0;
  const count = aggregation._count;
  const avg = Number(aggregation._avg.amount) || 0;
  const min = Number(aggregation._min.amount) || 0;
  const max = Number(aggregation._max.amount) || 0;

  return {
    summary: { total, count, avg, min, max },
    byCategory: categoryData.map((c) => ({
      categoryId: c.categoryId,
      categoryName: categoryMap.get(c.categoryId) ?? "Unknown",
      totalSpend: Number(c._sum.amount) || 0,
      expenseCount: c._count,
    })),
    trend: Array.from(trendMap.entries()).map(([date, value]) => ({ date, value })),
  };
}

export async function getExpenseTrend(
  businessId: string,
  dateRange?: DateRange,
): Promise<TrendPoint[]> {
  const dateFilter = buildDateFilter(dateRange);
  const where: Record<string, unknown> = {
    businessId,
    status: { in: ["approved", "paid"] },
  };
  if (dateFilter) where.expenseDate = dateFilter;

  const expenses = await prisma.expense.findMany({
    where,
    select: { expenseDate: true, amount: true },
    orderBy: { expenseDate: "asc" },
  });

  const grouped = new Map<string, number>();
  for (const e of expenses) {
    const key = e.expenseDate.toISOString().slice(0, 10);
    grouped.set(key, (grouped.get(key) ?? 0) + Number(e.amount));
  }

  return Array.from(grouped.entries()).map(([date, value]) => ({ date, value }));
}

export async function getExpensesByCategory(
  businessId: string,
  dateRange?: DateRange,
): Promise<CategorySpend[]> {
  const dateFilter = buildDateFilter(dateRange);
  const where: Record<string, unknown> = {
    businessId,
    status: { in: ["approved", "paid"] },
  };
  if (dateFilter) where.expenseDate = dateFilter;

  const data = await prisma.expense.groupBy({
    by: ["categoryId"],
    where,
    _count: true,
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  const categoryIds = data.map((c) => c.categoryId);
  const categoryMap = new Map<string, string>();
  if (categoryIds.length > 0) {
    const categories = await prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    for (const c of categories) {
      categoryMap.set(c.id, c.name);
    }
  }

  return data.map((c) => ({
    categoryId: c.categoryId,
    categoryName: categoryMap.get(c.categoryId) ?? "Unknown",
    totalSpend: Number(c._sum.amount) || 0,
    expenseCount: c._count,
  }));
}
