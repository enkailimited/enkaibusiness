import "server-only";

import { prisma } from "@/server/db";

export interface ChurnRisk {
  customerId: string;
  customerName: string;
  phone?: string;
  email?: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  daysSinceLastPurchase: number;
  totalPurchases: number;
  averageOrderValue: number;
}

export async function detectChurnRisk(
  businessId: string,
  thresholdDays: number = 60,
): Promise<ChurnRisk[]> {
  const customers = await prisma.customer.findMany({
    where: { businessId, isActive: true },
    include: {
      sales: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { grandTotal: true, createdAt: true },
      },
    },
  });

  const now = new Date();

  return customers
    .map((customer) => {
      const lastPurchase = customer.sales[0]?.createdAt || null;
      const daysSinceLastPurchase = lastPurchase
        ? Math.floor((now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      const totalPurchases = customer.sales.length;
      const totalSpent = customer.sales.reduce((s, sale) => s + Number(sale.grandTotal), 0);
      const averageOrderValue = totalPurchases > 0 ? totalSpent / totalPurchases : 0;

      const recencyScore = Math.min(daysSinceLastPurchase / thresholdDays, 1);
      const frequencyScore = Math.min(1 / (totalPurchases + 1), 1);
      const valueScore = Math.min(averageOrderValue / 100000, 1);

      const riskScore = recencyScore * 0.5 + frequencyScore * 0.3 + (1 - valueScore) * 0.2;
      const riskLevel: ChurnRisk["riskLevel"] =
        riskScore >= 0.7 ? "high" : riskScore >= 0.4 ? "medium" : "low";

      return {
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName || ""}`.trim(),
        phone: customer.phone || undefined,
        email: customer.email || undefined,
        riskScore: Math.round(riskScore * 100) / 100,
        riskLevel,
        daysSinceLastPurchase,
        totalPurchases,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      };
    })
    .filter((c) => c.riskLevel !== "low")
    .sort((a, b) => b.riskScore - a.riskScore);
}
