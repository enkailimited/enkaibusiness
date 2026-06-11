import "server-only";

import { prisma } from "@/server/db";
import type { DateRange, PurchasesReport, TrendPoint, SupplierSpend } from "../types";

function buildDateFilter(dateRange?: DateRange): Record<string, Date> | undefined {
  if (!dateRange) return undefined;
  const filter: Record<string, Date> = {};
  if (dateRange.startDate) filter.gte = new Date(dateRange.startDate);
  if (dateRange.endDate) filter.lte = new Date(dateRange.endDate);
  return Object.keys(filter).length ? filter : undefined;
}

export async function getPurchaseSummary(
  businessId: string,
  dateRange?: DateRange,
): Promise<PurchasesReport> {
  const dateFilter = buildDateFilter(dateRange);
  const where: Record<string, unknown> = { businessId, status: "completed" };
  if (dateFilter) where.purchaseDate = dateFilter;

  const [aggregation, supplierData, trendData] = await Promise.all([
    prisma.purchase.aggregate({
      where,
      _sum: { total: true },
      _count: true,
      _avg: { total: true },
      _min: { total: true },
      _max: { total: true },
    }),
    prisma.purchase.groupBy({
      by: ["supplierId"],
      where,
      _count: true,
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 20,
    }),
    prisma.purchase.findMany({
      where,
      select: { purchaseDate: true, total: true },
      orderBy: { purchaseDate: "asc" },
    }),
  ]);

  const supplierIds = supplierData.map((s) => s.supplierId);
  const supplierMap = new Map<string, string>();
  if (supplierIds.length > 0) {
    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true },
    });
    for (const s of suppliers) {
      supplierMap.set(s.id, s.name);
    }
  }

  const trendMap = new Map<string, number>();
  for (const p of trendData) {
    const key = p.purchaseDate.toISOString().slice(0, 10);
    trendMap.set(key, (trendMap.get(key) ?? 0) + Number(p.total));
  }

  const total = Number(aggregation._sum.total) || 0;
  const count = aggregation._count;
  const avg = Number(aggregation._avg.total) || 0;
  const min = Number(aggregation._min.total) || 0;
  const max = Number(aggregation._max.total) || 0;

  return {
    summary: { total, count, avg, min, max },
    bySupplier: supplierData.map((s) => ({
      supplierId: s.supplierId,
      supplierName: supplierMap.get(s.supplierId) ?? "Unknown",
      totalSpend: Number(s._sum.total) || 0,
      purchaseCount: s._count,
    })),
    trend: Array.from(trendMap.entries()).map(([date, value]) => ({ date, value })),
  };
}

export async function getSpendBySupplier(
  businessId: string,
  dateRange?: DateRange,
): Promise<SupplierSpend[]> {
  const dateFilter = buildDateFilter(dateRange);
  const where: Record<string, unknown> = { businessId, status: "completed" };
  if (dateFilter) where.purchaseDate = dateFilter;

  const data = await prisma.purchase.groupBy({
    by: ["supplierId"],
    where,
    _count: true,
    _sum: { total: true },
    orderBy: { _sum: { total: "desc" } },
    take: 50,
  });

  const supplierIds = data.map((s) => s.supplierId);
  const supplierMap = new Map<string, string>();
  if (supplierIds.length > 0) {
    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true },
    });
    for (const s of suppliers) {
      supplierMap.set(s.id, s.name);
    }
  }

  return data.map((s) => ({
    supplierId: s.supplierId,
    supplierName: supplierMap.get(s.supplierId) ?? "Unknown",
    totalSpend: Number(s._sum.total) || 0,
    purchaseCount: s._count,
  }));
}

export async function getPurchaseTrend(
  businessId: string,
  dateRange?: DateRange,
): Promise<TrendPoint[]> {
  const dateFilter = buildDateFilter(dateRange);
  const where: Record<string, unknown> = { businessId, status: "completed" };
  if (dateFilter) where.purchaseDate = dateFilter;

  const purchases = await prisma.purchase.findMany({
    where,
    select: { purchaseDate: true, total: true },
    orderBy: { purchaseDate: "asc" },
  });

  const grouped = new Map<string, number>();
  for (const p of purchases) {
    const key = p.purchaseDate.toISOString().slice(0, 10);
    grouped.set(key, (grouped.get(key) ?? 0) + Number(p.total));
  }

  return Array.from(grouped.entries()).map(([date, value]) => ({ date, value }));
}
