import "server-only";

import { prisma } from "@/server/db";

export interface ReorderRecommendation {
  itemId: string;
  itemName: string;
  currentStock: number;
  reorderPoint: number;
  suggestedOrderQty: number;
  priority: "critical" | "high" | "medium" | "low";
  supplierName?: string;
}

export async function getReorderRecommendations(
  businessId: string,
): Promise<ReorderRecommendation[]> {
  const items = await prisma.catalogItem.findMany({
    where: { businessId, trackStock: true, isActive: true },
    include: {
      balances: true,
    },
    orderBy: { name: "asc" },
  });

  const recommendations: ReorderRecommendation[] = [];

  for (const item of items) {
    const currentStock = item.balances.reduce((s, b) => s + Number(b.quantityOnHand), 0);
    const reorderPoint = Math.max(item.balances[0]?.reorderPoint ? Number(item.balances[0].reorderPoint) : 10, 1);

    if (currentStock <= reorderPoint) {
      const stockoutRisk = reorderPoint > 0 ? 1 - currentStock / reorderPoint : 1;
      const priority: ReorderRecommendation["priority"] =
        stockoutRisk >= 0.8 ? "critical" :
        stockoutRisk >= 0.5 ? "high" :
        stockoutRisk >= 0.2 ? "medium" : "low";

      recommendations.push({
        itemId: item.id,
        itemName: item.name,
        currentStock,
        reorderPoint,
        suggestedOrderQty: Math.ceil(reorderPoint * 2 - currentStock),
        priority,
      });
    }
  }

  return recommendations.sort((a, b) => {
    const p = { critical: 0, high: 1, medium: 2, low: 3 };
    return p[a.priority] - p[b.priority];
  });
}
