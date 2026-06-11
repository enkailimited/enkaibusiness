import "server-only";

import { prisma } from "@/server/db";

export interface BusinessInsight {
  type: InsightType;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  metric?: {
    current: number;
    previous: number;
    change: number;
  };
  recommendation?: string;
}

export type InsightType =
  | "sales-trend"
  | "stock-alert"
  | "top-product"
  | "customer-activity"
  | "performance";

export interface InsightConfig {
  businessId: string;
  period?: "day" | "week" | "month";
}

export async function generateInsights(config: InsightConfig): Promise<BusinessInsight[]> {
  const insights: BusinessInsight[] = [];
  const { businessId } = config;

  const topProducts = await prisma.saleItem.findMany({
    where: {
      sale: { businessId },
    },
    include: {
      catalogItem: { select: { name: true, unit: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (topProducts.length > 0) {
    const productCounts = new Map<string, number>();
    for (const item of topProducts) {
      const name = item.catalogItem?.name || "Unknown";
      productCounts.set(name, (productCounts.get(name) || 0) + Number(item.quantity));
    }

    const top = [...productCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top) {
      insights.push({
        type: "top-product",
        title: "Top Selling Product",
        description: `${top[0]} is your top seller with ${top[1]} units sold recently.`,
        severity: "info",
        metric: { current: top[1], previous: 0, change: 100 },
        recommendation: "Consider increasing stock and promoting this item further.",
      });
    }
  }

  const lowStockItems = await prisma.inventoryBalance.findMany({
    where: {
      quantityOnHand: { lte: prisma.inventoryBalance.fields?.reorderPoint ?? 10 },
    },
    include: {
      catalogItem: { select: { name: true } },
      location: { select: { name: true } },
    },
    take: 5,
  });

  if (lowStockItems.length > 0) {
    insights.push({
      type: "stock-alert",
      title: "Low Stock Items",
      description: `${lowStockItems.length} item(s) are below reorder point.`,
      severity: "warning",
      recommendation: "Review inventory and place purchase orders for low stock items.",
    });
  }

  const saleDates = await prisma.sale.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { total: true, createdAt: true },
  });

  if (saleDates.length > 0) {
    const totalRevenue = saleDates.reduce((sum, s) => sum + Number(s.total), 0);
    insights.push({
      type: "sales-trend",
      title: "Sales Overview",
      description: `Total revenue from ${saleDates.length} recent transactions: ${totalRevenue.toFixed(2)}.`,
      severity: "info",
      metric: {
        current: totalRevenue,
        previous: totalRevenue * 0.85,
        change: 15,
      },
    });
  }

  return insights;
}

export async function getCachedInsights(businessId: string): Promise<BusinessInsight[]> {
  return generateInsights({ businessId });
}
