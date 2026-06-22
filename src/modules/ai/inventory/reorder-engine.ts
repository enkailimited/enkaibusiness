import "server-only";

import { prisma } from "@/server/db";

export interface ProductVelocity {
  id: string;
  name: string;
  dailySalesRate: number;
  monthlyQuantity: number;
  stockOnHand: number;
  reorderPoint: number;
  daysUntilStockout: number;
  category: "fast" | "medium" | "slow" | "dead";
}

export interface ReorderRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  averageDailySales: number;
  daysUntilStockout: number;
  priority: "immediate" | "today" | "this_week" | "next_week";
  reason: string;
}

export class ReorderEngine {
  async getProductVelocity(businessId: string, limit = 50): Promise<ProductVelocity[]> {
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

    const products = await prisma.catalogItem.findMany({
      where: { businessId, isActive: true },
      include: {
        balances: { take: 1, orderBy: { updatedAt: "desc" } },
        saleItems: {
          where: { sale: { createdAt: { gte: threeMonthsAgo } } },
          select: { quantity: true, sale: { select: { createdAt: true } } },
        },
      },
    });

    const thisMonthSales = await prisma.saleItem.groupBy({
      by: ["catalogItemId"],
      where: { sale: { businessId, createdAt: { gte: thisMonth, lt: nextMonth } } },
      _sum: { quantity: true },
    });
    const thisMonthMap = new Map(thisMonthSales.map((s) => [s.catalogItemId, Number(s._sum.quantity || 0)]));

    return products.map((p) => {
      const balance = p.balances[0];
      const stockOnHand = Number(balance?.quantityOnHand || 0);
      const reorderPoint = Number(balance?.reorderPoint || 0);

      const total90Qty = p.saleItems.reduce((sum, si) => sum + Number(si.quantity), 0);
      const dailySalesRate = total90Qty / 90;

      const monthlyQty = thisMonthMap.get(p.id) || 0;
      const daysUntilStockout = dailySalesRate > 0 ? stockOnHand / dailySalesRate : 999;

      let category: ProductVelocity["category"] = "dead";
      if (dailySalesRate > 5) category = "fast";
      else if (dailySalesRate > 1) category = "medium";
      else if (dailySalesRate > 0) category = "slow";

      return {
        id: p.id,
        name: p.name,
        dailySalesRate: Math.round(dailySalesRate * 100) / 100,
        monthlyQuantity: monthlyQty,
        stockOnHand,
        reorderPoint,
        daysUntilStockout: Math.round(daysUntilStockout),
        category,
      };
    });
  }

  async getReorderRecommendations(businessId: string): Promise<ReorderRecommendation[]> {
    const velocityData = await this.getProductVelocity(businessId);
    const recommendations: ReorderRecommendation[] = [];

    for (const product of velocityData.filter((p) => p.stockOnHand > 0 || p.dailySalesRate > 0)) {
      if (product.daysUntilStockout <= 30 || product.stockOnHand <= product.reorderPoint) {
        const daysOfStock = 30;
        const suggestedQty = Math.ceil(product.dailySalesRate * daysOfStock - product.stockOnHand);
        if (suggestedQty <= 0) continue;

        let priority: ReorderRecommendation["priority"] = "next_week";
        if (product.daysUntilStockout <= 3) priority = "immediate";
        else if (product.daysUntilStockout <= 7) priority = "today";
        else if (product.daysUntilStockout <= 14) priority = "this_week";

        let reason: string;
        if (product.stockOnHand <= product.reorderPoint) {
          reason = `Stock imefikia kiwango cha chini (${product.stockOnHand}).`;
        } else {
          reason = `Inakadiriwa kuisha ndani ya siku ${product.daysUntilStockout}.`;
        }

        recommendations.push({
          productId: product.id,
          productName: product.name,
          currentStock: product.stockOnHand,
          reorderPoint: product.reorderPoint,
          suggestedQuantity: Math.max(suggestedQty, 1),
          averageDailySales: product.dailySalesRate,
          daysUntilStockout: product.daysUntilStockout,
          priority,
          reason,
        });
      }
    }

    const priorityOrder: Record<string, number> = { immediate: 0, today: 1, this_week: 2, next_week: 3 };
    recommendations.sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));

    return recommendations;
  }

  async getFastMovers(businessId: string, limit = 10): Promise<ProductVelocity[]> {
    const velocities = await this.getProductVelocity(businessId, limit);
    return velocities.filter((v) => v.category === "fast").slice(0, limit);
  }

  async getSlowMovers(businessId: string, limit = 10): Promise<ProductVelocity[]> {
    const velocities = await this.getProductVelocity(businessId, limit * 3);
    return velocities.filter((v) => v.category === "slow" || v.category === "dead").slice(0, limit);
  }
}

export const reorderEngine = new ReorderEngine();
