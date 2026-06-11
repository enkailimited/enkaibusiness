import "server-only";

import { prisma } from "@/server/db";

export interface SalesTrend {
  daily: Array<{ date: string; total: number; count: number }>;
  weekly: Array<{ week: string; total: number; count: number }>;
  monthly: Array<{ month: string; total: number; count: number }>;
  topProducts: Array<{ name: string; totalSold: number; revenue: number }>;
  topCustomers: Array<{ id: string; name: string; totalSpent: number; orderCount: number }>;
}

export async function getSalesTrends(
  businessId: string,
  days: number = 30,
): Promise<SalesTrend> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const sales = await prisma.sale.findMany({
    where: { businessId, createdAt: { gte: startDate } },
    select: {
      grandTotal: true,
      createdAt: true,
      customerId: true,
      customer: { select: { id: true, firstName: true, lastName: true } },
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          catalogItem: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const dailyMap: Record<string, { total: number; count: number }> = {};
  const weeklyMap: Record<string, { total: number; count: number }> = {};
  const monthlyMap: Record<string, { total: number; count: number }> = {};
  const productSales: Record<string, { totalSold: number; revenue: number }> = {};
  const customerSpend: Record<string, { name: string; totalSpent: number; orderCount: number }> = {};

  for (const sale of sales) {
    const d = sale.createdAt;
    const dayKey = d.toISOString().split("T")[0] || "unknown";
    const weekKey = getWeekKey(d);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const total = Number(sale.grandTotal);

    if (!dailyMap[dayKey]) { dailyMap[dayKey] = { total: 0, count: 0 }; }
    dailyMap[dayKey].total += total;
    dailyMap[dayKey].count++;

    if (!weeklyMap[weekKey]) { weeklyMap[weekKey] = { total: 0, count: 0 }; }
    weeklyMap[weekKey].total += total;
    weeklyMap[weekKey].count++;

    if (!monthlyMap[monthKey]) { monthlyMap[monthKey] = { total: 0, count: 0 }; }
    monthlyMap[monthKey].total += total;
    monthlyMap[monthKey].count++;

    for (const item of sale.items) {
      const name = item.catalogItem.name;
      let prodEntry = productSales[name];
      if (!prodEntry) { prodEntry = { totalSold: 0, revenue: 0 }; productSales[name] = prodEntry; }
      prodEntry.totalSold += Number(item.quantity);
      prodEntry.revenue += Number(item.quantity) * Number(item.unitPrice);
    }

    if (sale.customer) {
      const customerId = sale.customer.id;
      const name = `${sale.customer.firstName} ${sale.customer.lastName || ""}`.trim();
      let custEntry = customerSpend[customerId];
      if (!custEntry) { custEntry = { name, totalSpent: 0, orderCount: 0 }; customerSpend[customerId] = custEntry; }
      custEntry.totalSpent += total;
      custEntry.orderCount++;
    }
  }

  return {
    daily: Object.entries(dailyMap).map(([date, data]) => ({ date, ...data })),
    weekly: Object.entries(weeklyMap).map(([week, data]) => ({ week, ...data })),
    monthly: Object.entries(monthlyMap).map(([month, data]) => ({ month, ...data })),
    topProducts: Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
    topCustomers: Object.entries(customerSpend)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10),
  };
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return `${d.getFullYear()}-W${String(Math.ceil((d.getDate() + 1) / 7)).padStart(2, "0")}`;
}

export async function getProfitAnalysis(businessId: string, days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const sales = await prisma.sale.findMany({
    where: { businessId, createdAt: { gte: startDate } },
    select: {
      grandTotal: true,
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          catalogItem: { select: { costPrice: true } },
        },
      },
    },
  });

  let totalRevenue = 0;
  let totalCost = 0;

  for (const sale of sales) {
    totalRevenue += Number(sale.grandTotal);
    for (const item of sale.items) {
      const costPrice = item.catalogItem.costPrice ? Number(item.catalogItem.costPrice) : 0;
      totalCost += Number(item.quantity) * costPrice;
    }
  }

  const grossProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    margin: Math.round(margin * 100) / 100,
    periodDays: days,
  };
}
