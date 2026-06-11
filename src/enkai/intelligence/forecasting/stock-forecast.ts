import "server-only";

import { prisma } from "@/server/db";

export interface StockForecast {
  itemId: string;
  itemName: string;
  currentStock: number;
  avgDailyUsage: number;
  daysUntilStockout: number;
  recommendedReorder: number;
  reorderPoint: number;
}

export async function forecastStock(
  businessId: string,
  days: number = 30,
): Promise<StockForecast[]> {
  const items = await prisma.catalogItem.findMany({
    where: { businessId, trackStock: true, isActive: true },
    include: {
      balances: true,
      saleItems: {
        where: {
          sale: { createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } },
        },
        select: { quantity: true },
      },
    },
  });

  return items.map((item) => {
    const currentStock = item.balances.reduce((s, b) => s + Number(b.quantityOnHand), 0);
    const totalSold = item.saleItems.reduce((s, si) => s + Number(si.quantity), 0);
    const avgDailyUsage = days > 0 ? totalSold / days : 0;
    const daysUntilStockout = avgDailyUsage > 0 ? Math.floor(currentStock / avgDailyUsage) : 999;
    const reorderPoint = Math.max(item.balances[0]?.reorderPoint ? Number(item.balances[0].reorderPoint) : 10, 1);
    const recommendedReorder = Math.max(
      Math.ceil(avgDailyUsage * 14 - currentStock),
      reorderPoint * 2 - currentStock,
      0,
    );

    return {
      itemId: item.id,
      itemName: item.name,
      currentStock,
      avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
      daysUntilStockout,
      recommendedReorder,
      reorderPoint,
    };
  });
}

export async function getDeadStock(
  businessId: string,
  days: number = 90,
): Promise<Array<{ itemId: string; itemName: string; currentStock: number; lastSold: Date | null; value: number }>> {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const items = await prisma.catalogItem.findMany({
    where: { businessId, trackStock: true, isActive: true },
    include: {
      balances: true,
      saleItems: {
        where: { sale: { createdAt: { gte: cutoffDate } } },
        take: 1,
        select: { quantity: true },
      },
    },
  });

  return items
    .filter((item) => item.saleItems.length === 0)
    .map((item) => ({
      itemId: item.id,
      itemName: item.name,
      currentStock: item.balances.reduce((s, b) => s + Number(b.quantityOnHand), 0),
      lastSold: null,
      value: item.balances.reduce((s, b) => s + Number(b.quantityOnHand) * Number(item.price), 0),
    }))
    .filter((item) => item.currentStock > 0);
}
