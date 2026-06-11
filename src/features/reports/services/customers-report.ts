import "server-only";

import { prisma } from "@/server/db";
import type { DateRange, CustomersReport, TopCustomer, AcquisitionPoint } from "../types";

function buildDateFilter(dateRange?: DateRange): Record<string, Date> | undefined {
  if (!dateRange) return undefined;
  const filter: Record<string, Date> = {};
  if (dateRange.startDate) filter.gte = new Date(dateRange.startDate);
  if (dateRange.endDate) filter.lte = new Date(dateRange.endDate);
  return Object.keys(filter).length ? filter : undefined;
}

export async function getCustomerSummary(
  businessId: string,
  dateRange?: DateRange,
): Promise<CustomersReport> {
  const dateFilter = buildDateFilter(dateRange);

  const [totalCustomers, newCustomers, activeCustomerIds, topSalesData] =
    await Promise.all([
      prisma.customer.count({ where: { businessId } }),
      dateFilter
        ? prisma.customer.count({
            where: { businessId, createdAt: dateFilter },
          })
        : Promise.resolve(0),
      prisma.sale.groupBy({
        by: ["customerId"],
        where: {
          businessId,
          customerId: { not: null },
          ...(dateFilter ? { saleDate: dateFilter } : {}),
        },
        _count: true,
      }),
      prisma.sale.groupBy({
        by: ["customerId"],
        where: {
          businessId,
          customerId: { not: null },
          ...(dateFilter ? { saleDate: dateFilter } : {}),
        },
        _sum: { grandTotal: true },
        _count: true,
        orderBy: { _sum: { grandTotal: "desc" } },
        take: 10,
      }),
    ]);

  const customerIds = topSalesData
    .map((s) => s.customerId)
    .filter(Boolean) as string[];
  const customerMap = new Map<
    string,
    { firstName: string; lastName: string | null }
  >();
  if (customerIds.length > 0) {
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    for (const c of customers) {
      customerMap.set(c.id, { firstName: c.firstName, lastName: c.lastName });
    }
  }

  const completedSales = await prisma.sale.findMany({
    where: {
      businessId,
      customerId: { not: null },
      status: "completed",
      ...(dateFilter ? { saleDate: dateFilter } : {}),
    },
    select: { customerId: true, saleDate: true },
    orderBy: { saleDate: "desc" },
  });

  const lastPurchaseMap = new Map<string, string>();
  for (const s of completedSales) {
    if (s.customerId && !lastPurchaseMap.has(s.customerId)) {
      lastPurchaseMap.set(s.customerId, s.saleDate.toISOString());
    }
  }

  return {
    summary: {
      totalCustomers,
      newCustomers,
      activeCustomers: activeCustomerIds.length,
    },
    topCustomers: topSalesData.map((s) => {
      const c = customerMap.get(s.customerId ?? "");
      return {
        customerId: s.customerId ?? "",
        customerName: c
          ? `${c.firstName}${c.lastName ? ` ${c.lastName}` : ""}`
          : "Unknown",
        totalSpend: Number(s._sum.grandTotal) || 0,
        saleCount: s._count,
        lastPurchase: lastPurchaseMap.get(s.customerId ?? "") ?? null,
      };
    }),
    acquisition: [],
  };
}

export async function getTopCustomers(
  businessId: string,
  limit = 10,
): Promise<TopCustomer[]> {
  const data = await prisma.sale.groupBy({
    by: ["customerId"],
    where: { businessId, customerId: { not: null }, status: "completed" },
    _sum: { grandTotal: true },
    _count: true,
    orderBy: { _sum: { grandTotal: "desc" } },
    take: limit,
  });

  const customerIds = data.map((s) => s.customerId).filter(Boolean) as string[];
  const customerMap = new Map<
    string,
    { firstName: string; lastName: string | null }
  >();
  if (customerIds.length > 0) {
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    for (const c of customers) {
      customerMap.set(c.id, { firstName: c.firstName, lastName: c.lastName });
    }
  }

  const completedSales = await prisma.sale.findMany({
    where: {
      businessId,
      customerId: { in: customerIds.length > 0 ? customerIds : undefined },
      status: "completed",
    },
    select: { customerId: true, saleDate: true },
    orderBy: { saleDate: "desc" },
  });

  const lastPurchaseMap = new Map<string, string>();
  for (const s of completedSales) {
    if (s.customerId && !lastPurchaseMap.has(s.customerId)) {
      lastPurchaseMap.set(s.customerId, s.saleDate.toISOString());
    }
  }

  return data.map((s) => {
    const c = customerMap.get(s.customerId ?? "");
    return {
      customerId: s.customerId ?? "",
      customerName: c
        ? `${c.firstName}${c.lastName ? ` ${c.lastName}` : ""}`
        : "Unknown",
      totalSpend: Number(s._sum.grandTotal) || 0,
      saleCount: s._count,
      lastPurchase: lastPurchaseMap.get(s.customerId ?? "") ?? null,
    };
  });
}

export async function getCustomerAcquisition(
  businessId: string,
  dateRange?: DateRange,
): Promise<AcquisitionPoint[]> {
  const dateFilter = buildDateFilter(dateRange);
  const where: Record<string, unknown> = { businessId };
  if (dateFilter) where.createdAt = dateFilter;

  const customers = await prisma.customer.findMany({
    where,
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const grouped = new Map<string, number>();
  for (const c of customers) {
    const key = c.createdAt.toISOString().slice(0, 10);
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }

  return Array.from(grouped.entries()).map(([date, count]) => ({ date, count }));
}
