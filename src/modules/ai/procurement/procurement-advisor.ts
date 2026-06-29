import "server-only";

import { prisma } from "@/server/db";

export interface SupplierAnalytic {
  id: string;
  name: string;
  phone?: string;
  totalPurchases: number;
  totalSpent: number;
  averageCost: number;
  orderCount: number;
  reliability: number;
  averageDeliveryDays: number;
  score: number;
}

export interface ProcurementRecommendation {
  productName: string;
  bestSupplier: { id: string; name: string; cost: number; score: number };
  cheapestSupplier?: { id: string; name: string; cost: number };
  fastestSupplier?: { id: string; name: string; days: number };
  reason: string;
}

export class ProcurementAdvisor {
  async analyzeSuppliers(businessId: string): Promise<SupplierAnalytic[]> {
    const suppliers = await prisma.supplier.findMany({
      where: { businessId, isActive: true },
      include: {
        purchaseOrders: {
          where: { status: "received" },
          select: { total: true, createdAt: true, updatedAt: true, items: { select: { quantity: true, unitCost: true } } },
        },
      },
    });

    return suppliers.map((s) => {
      const orders = s.purchaseOrders;
      const totalSpent = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const totalItems = orders.reduce((sum, o) => sum + o.items.reduce((s2, i) => s2 + Number(i.quantity), 0), 0);
      const orderCount = orders.length;

      const deliveryDays = orders
        .filter((o) => o.updatedAt && o.createdAt)
        .map((o) => Math.ceil((o.updatedAt.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
      const avgDelivery = deliveryDays.length > 0
        ? deliveryDays.reduce((sum, d) => sum + d, 0) / deliveryDays.length
        : 7;

      const items = orders.flatMap((o) => o.items);
      const totalQty = items.reduce((sum, i) => sum + Number(i.quantity), 0);
      const totalCost = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitCost), 0);
      const avgCost = totalQty > 0 ? totalCost / totalQty : 0;

      const reliability = orderCount > 0
        ? Math.min(100, (orders.filter((o) => o.status === "received").length / orderCount) * 100)
        : 50;

      const deliveryScore = Math.max(0, 100 - avgDelivery * 5);
      const costScore = avgCost > 0 ? Math.min(100, 100 - (avgCost / 50000) * 10) : 50;
      const volumeScore = Math.min(100, (totalSpent / 1000000) * 20);

      const score = Math.round(reliability * 0.4 + deliveryScore * 0.25 + costScore * 0.2 + volumeScore * 0.15);

      return {
        id: s.id,
        name: s.name,
        phone: s.phone || undefined,
        totalPurchases: totalSpent,
        totalSpent,
        averageCost: Math.round(avgCost),
        orderCount,
        reliability: Math.round(reliability),
        averageDeliveryDays: Math.round(avgDelivery),
        score,
      };
    }).sort((a, b) => b.score - a.score);
  }

  async getBestSupplier(businessId: string, productName?: string): Promise<SupplierAnalytic | null> {
    const suppliers = await this.analyzeSuppliers(businessId);
    return suppliers[0] || null;
  }

  async getCheapestSupplier(businessId: string): Promise<SupplierAnalytic | null> {
    const suppliers = await this.analyzeSuppliers(businessId);
    return suppliers.sort((a, b) => a.averageCost - b.averageCost)[0] || null;
  }

  async getFastestSupplier(businessId: string): Promise<SupplierAnalytic | null> {
    const suppliers = await this.analyzeSuppliers(businessId);
    return suppliers.sort((a, b) => a.averageDeliveryDays - b.averageDeliveryDays)[0] || null;
  }

  async getRecommendations(businessId: string): Promise<ProcurementRecommendation[]> {
    const suppliers = await this.analyzeSuppliers(businessId);
    if (suppliers.length === 0) return [];

    const best = suppliers[0];
    const cheapest = [...suppliers].sort((a, b) => a.averageCost - b.averageCost)[0];
    const fastest = [...suppliers].sort((a, b) => a.averageDeliveryDays - b.averageDeliveryDays)[0];

    const recommendations: ProcurementRecommendation[] = [];

    if (best) {
      recommendations.push({
        productName: "Bidhaa kwa ujumla",
        bestSupplier: { id: best.id, name: best.name, cost: best.averageCost, score: best.score },
        cheapestSupplier: cheapest && cheapest.id !== best.id
          ? { id: cheapest.id, name: cheapest.name, cost: cheapest.averageCost }
          : undefined,
        fastestSupplier: fastest && fastest.id !== best.id
          ? { id: fastest.id, name: fastest.name, days: fastest.averageDeliveryDays }
          : undefined,
        reason: `${best.name} ndiye msambazaji bora kwa ujumla (score: ${best.score}/100).`,
      });
    }

    if (cheapest && cheapest.id !== best?.id) {
      recommendations.push({
        productName: "Bidhaa kwa ujumla",
        bestSupplier: { id: best?.id || cheapest.id, name: best?.name || cheapest.name, cost: best?.averageCost || cheapest.averageCost, score: best?.score || cheapest.score },
        cheapestSupplier: { id: cheapest.id, name: cheapest.name, cost: cheapest.averageCost },
        reason: `${cheapest.name} ana bei nafuu zaidi (Tsh ${cheapest.averageCost.toLocaleString()}/unit).`,
      });
    }

    return recommendations;
  }
}

export const procurementAdvisor = new ProcurementAdvisor();
