import "server-only";

import { prisma } from "@/server/db";

export interface ABCAnalysis {
  aItems: Array<{ catalogItemId: string; name: string; contributionPercent: number; cumulativePercent: number }>;
  bItems: Array<{ catalogItemId: string; name: string; contributionPercent: number; cumulativePercent: number }>;
  cItems: Array<{ catalogItemId: string; name: string; contributionPercent: number; cumulativePercent: number }>;
}

export interface InventoryForecast {
  catalogItemId: string;
  name: string;
  currentStock: number;
  averageDailySales: number;
  daysUntilOutOfStock: number;
  suggestedReorderDate: Date;
  suggestedReorderQuantity: number;
}

export interface CustomerInsight {
  customerId: string;
  name: string;
  totalSales: number;
  transactionCount: number;
  averageOrderValue: number;
  lifetimeValue: number;
  lastPurchaseDate: Date | null;
  daysSinceLastPurchase: number;
  segment: string;
}

export class AnalyticsEngine {
  async abcAnalysis(businessId: string): Promise<ABCAnalysis> {
    const items = await prisma.catalogItem.findMany({
      where: { businessId },
      include: {
        saleItems: {
          select: { quantity: true, unitPrice: true },
        },
      },
    });

    const itemRevenue = items.map((item) => {
      const revenue = item.saleItems.reduce(
        (sum, si) => sum + Number(si.quantity) * Number(si.unitPrice),
        0,
      );
      return { catalogItemId: item.id, name: item.name, revenue };
    });

    const sorted = itemRevenue.sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = sorted.reduce((s, i) => s + i.revenue, 0);

    let cumulative = 0;
    const aItems: typeof sorted = [];
    const bItems: typeof sorted = [];
    const cItems: typeof sorted = [];

    for (const item of sorted) {
      const percent = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
      cumulative += percent;
      const entry = { ...item, contributionPercent: percent, cumulativePercent: cumulative };

      if (cumulative <= 80) aItems.push(entry);
      else if (cumulative <= 95) bItems.push(entry);
      else cItems.push(entry);
    }

    return { aItems, bItems, cItems };
  }

  async inventoryForecast(businessId: string): Promise<InventoryForecast[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const items = await prisma.catalogItem.findMany({
      where: { businessId, trackStock: true },
      include: {
        balances: { select: { quantityOnHand: true, reorderPoint: true } },
        saleItems: {
          where: { sale: { saleDate: { gte: thirtyDaysAgo } } },
          select: { quantity: true },
        },
      },
    });

    return items.map((item) => {
      const currentStock = item.balances.reduce((s, b) => s + Number(b.quantityOnHand), 0);
      const totalSold = item.saleItems.reduce((s, si) => s + Number(si.quantity), 0);
      const avgDailySales = totalSold / 30;
      const daysUntilOut = avgDailySales > 0 ? Math.floor(currentStock / avgDailySales) : 999;
      const reorderPoint = Math.max(...item.balances.map((b) => Number(b.reorderPoint || 0)), 0);

      const suggestedDate = new Date();
      suggestedDate.setDate(suggestedDate.getDate() + Math.max(0, daysUntilOut - 7));

      return {
        catalogItemId: item.id,
        name: item.name,
        currentStock,
        averageDailySales: avgDailySales,
        daysUntilOutOfStock: daysUntilOut,
        suggestedReorderDate: suggestedDate,
        suggestedReorderQuantity: Math.max(
          Math.ceil(avgDailySales * 14) - currentStock,
          reorderPoint * 2,
        ),
      };
    });
  }

  async customerInsights(businessId: string): Promise<CustomerInsight[]> {
    const customers = await prisma.customer.findMany({
      where: { businessId, isActive: true },
      include: {
        sales: {
          select: { grandTotal: true, saleDate: true },
          orderBy: { saleDate: "desc" },
          take: 100,
        },
      },
    });

    const now = new Date();
    return customers.map((c) => {
      const totalSales = c.sales.reduce((s, sale) => s + Number(sale.grandTotal), 0);
      const transactionCount = c.sales.length;
      const lastPurchase = c.sales[0]?.saleDate ?? null;
      const daysSinceLast = lastPurchase
        ? Math.floor((now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      return {
        customerId: c.id,
        name: `${c.firstName} ${c.lastName ?? ""}`.trim(),
        totalSales,
        transactionCount,
        averageOrderValue: transactionCount > 0 ? totalSales / transactionCount : 0,
        lifetimeValue: totalSales,
        lastPurchaseDate: lastPurchase,
        daysSinceLastPurchase: daysSinceLast,
        segment: c.customerType,
      };
    });
  }

  async deadStock(businessId: string): Promise<Array<{ catalogItemId: string; name: string; quantityOnHand: number; value: number; daysSinceLastSale: number }>> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const items = await prisma.catalogItem.findMany({
      where: { businessId, trackStock: true },
      include: {
        balances: { select: { quantityOnHand: true, unitCost: true } },
        saleItems: {
          where: { sale: { saleDate: { gte: ninetyDaysAgo } } },
          take: 1,
        },
      },
    });

    return items
      .filter((item) => item.saleItems.length === 0)
      .map((item) => ({
        catalogItemId: item.id,
        name: item.name,
        quantityOnHand: item.balances.reduce((s, b) => s + Number(b.quantityOnHand), 0),
        value: item.balances.reduce((s, b) => s + Number(b.quantityOnHand) * Number(b.unitCost || 0), 0),
        daysSinceLastSale: 90,
      }))
      .filter((item) => item.quantityOnHand > 0);
  }

  async fastMoving(businessId: string): Promise<Array<{ catalogItemId: string; name: string; totalSold: number; revenue: number }>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const items = await prisma.catalogItem.findMany({
      where: { businessId },
      include: {
        saleItems: {
          where: { sale: { saleDate: { gte: thirtyDaysAgo } } },
          select: { quantity: true, unitPrice: true },
        },
      },
    });

    return items
      .map((item) => {
        const totalSold = item.saleItems.reduce((s, si) => s + Number(si.quantity), 0);
        const revenue = item.saleItems.reduce((s, si) => s + Number(si.quantity) * Number(si.unitPrice), 0);
        return { catalogItemId: item.id, name: item.name, totalSold, revenue };
      })
      .filter((item) => item.totalSold > 0)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 50);
  }

  async salesForecast(businessId: string, days: number = 30): Promise<{
    forecast: Array<{ date: string; predictedRevenue: number }>;
    totalPredicted: number;
  }> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const sales = await prisma.sale.findMany({
      where: { businessId, saleDate: { gte: sixMonthsAgo } },
      select: { saleDate: true, grandTotal: true },
      orderBy: { saleDate: "asc" },
    });

    const dailyTotals: Record<string, number> = {};
    for (const sale of sales) {
      const dateKey = sale.saleDate.toISOString().slice(0, 10);
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + Number(sale.grandTotal);
    }

    const values = Object.values(dailyTotals);
    const avgDaily = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;

    const forecast: Array<{ date: string; predictedRevenue: number }> = [];
    const today = new Date();
    for (let i = 1; i <= days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.6 : 1.0;
      forecast.push({
        date: date.toISOString().slice(0, 10),
        predictedRevenue: avgDaily * weekendFactor,
      });
    }

    return {
      forecast,
      totalPredicted: forecast.reduce((s, d) => s + d.predictedRevenue, 0),
    };
  }
}

export const analyticsEngine = new AnalyticsEngine();
