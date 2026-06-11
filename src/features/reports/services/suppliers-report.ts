import "server-only";

import { prisma } from "@/server/db";
import type { DateRange, SuppliersReport, TopSupplier, SupplierReliability } from "../types";

function buildDateFilter(dateRange?: DateRange): Record<string, Date> | undefined {
  if (!dateRange) return undefined;
  const filter: Record<string, Date> = {};
  if (dateRange.startDate) filter.gte = new Date(dateRange.startDate);
  if (dateRange.endDate) filter.lte = new Date(dateRange.endDate);
  return Object.keys(filter).length ? filter : undefined;
}

export async function getSupplierSummary(
  businessId: string,
  dateRange?: DateRange,
): Promise<SuppliersReport> {
  const dateFilter = buildDateFilter(dateRange);

  const [totalSuppliers, supplierTypes, topData, poData] = await Promise.all([
    prisma.supplier.count({ where: { businessId } }),
    prisma.supplier.groupBy({
      by: ["supplierType"],
      where: { businessId },
      _count: true,
    }),
    prisma.purchase.groupBy({
      by: ["supplierId"],
      where: {
        businessId,
        status: "completed",
        ...(dateFilter ? { purchaseDate: dateFilter } : {}),
      },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    }),
    prisma.purchaseOrder.findMany({
      where: { businessId },
      select: { id: true, supplierId: true, status: true },
    }),
  ]);

  const supplierIds = topData.map((s) => s.supplierId);
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

  const poBySupplier = new Map<string, { total: number; received: number }>();
  for (const po of poData) {
    const entry = poBySupplier.get(po.supplierId) ?? { total: 0, received: 0 };
    entry.total++;
    if (po.status === "received") entry.received++;
    poBySupplier.set(po.supplierId, entry);
  }

  const typeMap = Object.fromEntries(
    supplierTypes.map((s) => [s.supplierType, s._count]),
  );

  return {
    summary: {
      totalSuppliers,
      localSuppliers: typeMap["local"] ?? 0,
      internationalSuppliers: typeMap["international"] ?? 0,
    },
    topSuppliers: topData.map((s) => ({
      supplierId: s.supplierId,
      supplierName: supplierMap.get(s.supplierId) ?? "Unknown",
      totalSpend: Number(s._sum.total) || 0,
      purchaseCount: s._count,
    })),
    reliability: Array.from(poBySupplier.entries()).map(
      ([supplierId, stats]) => ({
        supplierId,
        supplierName: supplierMap.get(supplierId) ?? "Unknown",
        onTimeRate: stats.total > 0 ? stats.received / stats.total : 0,
        totalOrders: stats.total,
      }),
    ),
  };
}

export async function getTopSuppliers(
  businessId: string,
  limit = 10,
): Promise<TopSupplier[]> {
  const data = await prisma.purchase.groupBy({
    by: ["supplierId"],
    where: { businessId, status: "completed" },
    _sum: { total: true },
    _count: true,
    orderBy: { _sum: { total: "desc" } },
    take: limit,
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

export async function getSupplierReliability(
  businessId: string,
): Promise<SupplierReliability[]> {
  const orders = await prisma.purchaseOrder.findMany({
    where: { businessId },
    select: { id: true, supplierId: true, status: true },
  });

  const supplierIds = [...new Set(orders.map((o) => o.supplierId))];
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

  const grouped = new Map<string, { total: number; received: number }>();
  for (const o of orders) {
    const entry = grouped.get(o.supplierId) ?? { total: 0, received: 0 };
    entry.total++;
    if (o.status === "received") entry.received++;
    grouped.set(o.supplierId, entry);
  }

  return Array.from(grouped.entries()).map(([supplierId, stats]) => ({
    supplierId,
    supplierName: supplierMap.get(supplierId) ?? "Unknown",
    onTimeRate: stats.total > 0 ? stats.received / stats.total : 0,
    totalOrders: stats.total,
  }));
}
