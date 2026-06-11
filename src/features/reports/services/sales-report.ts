import "server-only";

import { prisma } from "@/server/db";
import type { DateRange, SalesReport, TrendPoint, StaffSale, ProductSale } from "../types";

function buildDateFilter(dateRange?: DateRange): Record<string, Date> | undefined {
  if (!dateRange) return undefined;
  const filter: Record<string, Date> = {};
  if (dateRange.startDate) filter.gte = new Date(dateRange.startDate);
  if (dateRange.endDate) filter.lte = new Date(dateRange.endDate);
  return Object.keys(filter).length ? filter : undefined;
}

export async function getSalesSummary(
  businessId: string,
  dateRange?: DateRange,
): Promise<SalesReport> {
  const dateFilter = buildDateFilter(dateRange);
  const saleWhere: Record<string, unknown> = { businessId };
  if (dateFilter) saleWhere.saleDate = dateFilter;

  const [aggregation, statusGroups, staffSales, itemsSold] = await Promise.all([
    prisma.sale.aggregate({
      where: { ...saleWhere, status: "completed" },
      _sum: { grandTotal: true },
      _count: true,
      _avg: { grandTotal: true },
      _min: { grandTotal: true },
      _max: { grandTotal: true },
    }),
    prisma.sale.groupBy({
      by: ["status"],
      where: saleWhere,
      _count: true,
    }),
    prisma.sale.groupBy({
      by: ["staffId"],
      where: { ...saleWhere, staffId: { not: null } },
      _count: true,
      _sum: { grandTotal: true },
      orderBy: { _sum: { grandTotal: "desc" } },
      take: 10,
    }),
    prisma.saleItem.groupBy({
      by: ["catalogItemId"],
      where: {
        sale: { businessId, ...(dateFilter ? { saleDate: dateFilter } : {}) },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 10,
    }),
  ]);

  const staffIds = staffSales.map((s) => s.staffId).filter(Boolean) as string[];
  const staffMap = new Map<string, string>();
  if (staffIds.length > 0) {
    const staff = await prisma.staff.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, user: { select: { firstName: true, lastName: true } } },
    });
    for (const s of staff) {
      staffMap.set(s.id, `${s.user.firstName} ${s.user.lastName}`.trim());
    }
  }

  const itemIds = itemsSold.map((i) => i.catalogItemId);
  const itemMap = new Map<string, { name: string; sku: string | null }>();
  if (itemIds.length > 0) {
    const items = await prisma.catalogItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, sku: true },
    });
    for (const i of items) {
      itemMap.set(i.id, { name: i.name, sku: i.sku });
    }
  }

  const total = aggregation._sum.grandTotal ? Number(aggregation._sum.grandTotal) : 0;
  const count = aggregation._count;
  const avg = aggregation._avg.grandTotal ? Number(aggregation._avg.grandTotal) : 0;
  const min = aggregation._min.grandTotal ? Number(aggregation._min.grandTotal) : 0;
  const max = aggregation._max.grandTotal ? Number(aggregation._max.grandTotal) : 0;

  return {
    summary: { total, count, avg, min, max },
    byStatus: Object.fromEntries(statusGroups.map((g) => [g.status, g._count])),
    byStaff: staffSales.map((s) => ({
      staffId: s.staffId ?? "",
      staffName: staffMap.get(s.staffId ?? "") ?? "Unknown",
      saleCount: s._count,
      totalRevenue: Number(s._sum.grandTotal) || 0,
    })),
    topProducts: itemsSold.map((i) => ({
      productId: i.catalogItemId,
      productName: itemMap.get(i.catalogItemId)?.name ?? "Unknown",
      sku: itemMap.get(i.catalogItemId)?.sku ?? null,
      quantity: Number(i._sum.quantity) || 0,
      revenue: Number(i._sum.subtotal) || 0,
    })),
    trend: [],
  };
}

export async function getSalesTrend(
  businessId: string,
  dateRange?: DateRange,
): Promise<TrendPoint[]> {
  const dateFilter = buildDateFilter(dateRange);
  const sales = await prisma.sale.findMany({
    where: {
      businessId,
      status: "completed",
      ...(dateFilter ? { saleDate: dateFilter } : {}),
    },
    select: { saleDate: true, grandTotal: true },
    orderBy: { saleDate: "asc" },
  });

  const grouped = new Map<string, number>();
  for (const sale of sales) {
    const key = sale.saleDate.toISOString().slice(0, 10);
    grouped.set(key, (grouped.get(key) ?? 0) + Number(sale.grandTotal));
  }

  return Array.from(grouped.entries()).map(([date, value]) => ({ date, value }));
}

export async function getSalesByStatus(
  businessId: string,
): Promise<Record<string, number>> {
  const groups = await prisma.sale.groupBy({
    by: ["status"],
    where: { businessId },
    _count: true,
  });
  return Object.fromEntries(groups.map((g) => [g.status, g._count]));
}

export async function getSalesByStaff(
  businessId: string,
  dateRange?: DateRange,
): Promise<StaffSale[]> {
  const dateFilter = buildDateFilter(dateRange);
  const staffSales = await prisma.sale.groupBy({
    by: ["staffId"],
    where: {
      businessId,
      staffId: { not: null },
      ...(dateFilter ? { saleDate: dateFilter } : {}),
    },
    _count: true,
    _sum: { grandTotal: true },
    orderBy: { _sum: { grandTotal: "desc" } },
  });

  const staffIds = staffSales.map((s) => s.staffId).filter(Boolean) as string[];
  const staffMap = new Map<string, string>();
  if (staffIds.length > 0) {
    const staff = await prisma.staff.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, user: { select: { firstName: true, lastName: true } } },
    });
    for (const s of staff) {
      staffMap.set(s.id, `${s.user.firstName} ${s.user.lastName}`.trim());
    }
  }

  return staffSales.map((s) => ({
    staffId: s.staffId ?? "",
    staffName: staffMap.get(s.staffId ?? "") ?? "Unknown",
    saleCount: s._count,
    totalRevenue: Number(s._sum.grandTotal) || 0,
  }));
}
