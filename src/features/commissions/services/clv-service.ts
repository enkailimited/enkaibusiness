import "server-only";

import { prisma } from "@/server/db";
import type { CLVData, CLVAggregateMetrics } from "../types";

export async function updateCLV(businessId: string): Promise<CLVData | null> {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, createdAt: true },
    });

    if (!business) return null;

    const [subscriptionPayments, salesTotal] = await Promise.all([
      prisma.subscriptionPayment.aggregate({
        _sum: { amount: true },
        where: {
          subscription: { businessId },
        },
      }),
      prisma.sale.aggregate({
        _sum: { grandTotal: true },
        where: { businessId, status: { not: "VOIDED" } },
      }),
    ]);

    const totalSubscriptionRevenue = Number(subscriptionPayments._sum?.amount) || 0;
    const totalSalesRevenue = Number(salesTotal._sum?.grandTotal) || 0;
    const lifetimeValue = totalSubscriptionRevenue + totalSalesRevenue;

    const monthsSinceCreated = Math.max(
      1,
      Math.floor((Date.now() - new Date(business.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30.44)),
    );

    const averageRevenuePerPeriod = lifetimeValue / monthsSinceCreated;

    const totalTransactions = await prisma.sale.count({
      where: { businessId, status: { not: "VOIDED" } },
    });

    return {
      businessId: business.id,
      businessName: business.name,
      lifetimeValue,
      averageRevenuePerPeriod,
      customerLifespanMonths: monthsSinceCreated,
      totalTransactions,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("Update CLV error:", error);
    return null;
  }
}

export async function getCLV(businessId: string): Promise<CLVData | null> {
  return updateCLV(businessId);
}

export async function getCLVRankings(limit: number = 10): Promise<CLVData[]> {
  try {
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      select: { id: true, name: true, createdAt: true },
      take: 100,
    });

    const clvData: CLVData[] = [];

    for (const business of businesses) {
      const [subscriptionPayments, salesTotal] = await Promise.all([
        prisma.subscriptionPayment.aggregate({
          _sum: { amount: true },
          where: { subscription: { businessId: business.id } },
        }),
        prisma.sale.aggregate({
          _sum: { grandTotal: true },
          where: { businessId: business.id, status: { not: "VOIDED" } },
        }),
      ]);

      const totalSubscriptionRevenue = Number(subscriptionPayments._sum?.amount) || 0;
      const totalSalesRevenue = Number(salesTotal._sum?.grandTotal) || 0;
      const lifetimeValue = totalSubscriptionRevenue + totalSalesRevenue;

      const monthsSinceCreated = Math.max(
        1,
        Math.floor((Date.now() - new Date(business.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30.44)),
      );

      const totalTransactions = await prisma.sale.count({
        where: { businessId: business.id, status: { not: "VOIDED" } },
      });

      clvData.push({
        businessId: business.id,
        businessName: business.name,
        lifetimeValue,
        averageRevenuePerPeriod: lifetimeValue / monthsSinceCreated,
        customerLifespanMonths: monthsSinceCreated,
        totalTransactions,
        lastUpdated: new Date(),
      });
    }

    return clvData
      .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
      .slice(0, limit);
  } catch (error) {
    console.error("Get CLV rankings error:", error);
    return [];
  }
}

export async function aggregateCLVMetrics(): Promise<CLVAggregateMetrics> {
  try {
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      select: { id: true, name: true, createdAt: true },
    });

    if (businesses.length === 0) {
      return {
        averageCLV: 0,
        medianCLV: 0,
        topCLV: 0,
        bottomCLV: 0,
        totalBusinessesTracked: 0,
      };
    }

    const clvValues: number[] = [];

    for (const business of businesses) {
      const [subscriptionPayments, salesTotal] = await Promise.all([
        prisma.subscriptionPayment.aggregate({
          _sum: { amount: true },
          where: { subscription: { businessId: business.id } },
        }),
        prisma.sale.aggregate({
          _sum: { grandTotal: true },
          where: { businessId: business.id, status: { not: "VOIDED" } },
        }),
      ]);

      const lifetimeValue =
        (Number(subscriptionPayments._sum?.amount) || 0) +
        (Number(salesTotal._sum?.grandTotal) || 0);

      clvValues.push(lifetimeValue);
    }

    const sorted = [...clvValues].sort((a, b) => a - b);
    const totalBusinesses = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    if (totalBusinesses === 0) {
      return { averageCLV: 0, medianCLV: 0, topCLV: 0, bottomCLV: 0, totalBusinessesTracked: 0 };
    }

    const mid = Math.floor(totalBusinesses / 2);
    const median = totalBusinesses % 2 === 0
      ? (sorted[mid - 1]! + sorted[mid]!) / 2
      : sorted[mid]!;

    return {
      averageCLV: sum / totalBusinesses,
      medianCLV: median,
      topCLV: sorted[totalBusinesses - 1]!,
      bottomCLV: sorted[0]!,
      totalBusinessesTracked: totalBusinesses,
    };
  } catch (error) {
    console.error("Aggregate CLV metrics error:", error);
    return {
      averageCLV: 0,
      medianCLV: 0,
      topCLV: 0,
      bottomCLV: 0,
      totalBusinessesTracked: 0,
    };
  }
}
