import "server-only";

import { prisma } from "@/server/db";

export interface HealthScoreComponents {
  sales: number;
  cashflow: number;
  inventory: number;
  customers: number;
  debt: number;
}

export interface HealthScoreResult {
  overall: number;
  components: HealthScoreComponents;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
}

export class HealthScoreService {
  async calculate(businessId: string): Promise<HealthScoreResult> {
    const [sales, cashflow, inventory, customers, debt] = await Promise.all([
      this.calcSalesScore(businessId),
      this.calcCashflowScore(businessId),
      this.calcInventoryScore(businessId),
      this.calcCustomerScore(businessId),
      this.calcDebtScore(businessId),
    ]);

    const overall = Math.round(sales * 0.25 + cashflow * 0.2 + inventory * 0.2 + customers * 0.2 + debt * 0.15);

    let grade: HealthScoreResult["grade"] = "C";
    if (overall >= 85) grade = "A";
    else if (overall >= 70) grade = "B";
    else if (overall >= 50) grade = "C";
    else if (overall >= 30) grade = "D";
    else grade = "F";

    const summary = this.generateSummary(overall, grade);

    return { overall, components: { sales, cashflow, inventory, customers, debt }, grade, summary };
  }

  private async calcSalesScore(businessId: string): Promise<number> {
    const now = new Date();
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisWeekAgg, lastWeekAgg, thisMonthAgg, lastMonthAgg] = await Promise.all([
      prisma.sale.aggregate({ where: { businessId, createdAt: { gte: thisWeek } }, _sum: { total: true } }),
      prisma.sale.aggregate({ where: { businessId, createdAt: { gte: lastWeek, lt: thisWeek } }, _sum: { total: true } }),
      prisma.sale.aggregate({ where: { businessId, createdAt: { gte: thisMonth } }, _sum: { total: true } }),
      prisma.sale.aggregate({ where: { businessId, createdAt: { gte: lastMonth, lt: thisMonth } }, _sum: { total: true } }),
    ]);

    const thisW = Number(thisWeekAgg._sum.total || 0);
    const lastW = Number(lastWeekAgg._sum.total || 0);
    const thisM = Number(thisMonthAgg._sum.total || 0);
    const lastM = Number(lastMonthAgg._sum.total || 0);

    let score = 50;
    if (lastW > 0 && thisW >= lastW) score += 20;
    else if (lastW > 0 && thisW < lastW * 0.7) score -= 20;
    else if (lastW > 0 && thisW < lastW * 0.9) score -= 10;

    if (lastM > 0 && thisM >= lastM) score += 15;
    else if (lastM > 0 && thisM < lastM * 0.7) score -= 15;

    if (thisM > 0) score += 15;

    return Math.max(0, Math.min(100, score));
  }

  private async calcCashflowScore(businessId: string): Promise<number> {
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

    const [salesTotal, expenseTotal, unpaidInvoices] = await Promise.all([
      prisma.sale.aggregate({ where: { businessId, createdAt: { gte: thisMonth, lt: nextMonth } }, _sum: { total: true } }),
      prisma.expense.aggregate({ where: { businessId, createdAt: { gte: thisMonth, lt: nextMonth } }, _sum: { amount: true } }),
      prisma.invoice.aggregate({ where: { businessId, status: "sent", dueDate: { lt: new Date() } }, _sum: { total: true } }),
    ]);

    const sales = Number(salesTotal._sum.total || 0);
    const expenses = Number(expenseTotal._sum.amount || 0);
    const overdue = Number(unpaidInvoices._sum.total || 0);

    let score = 60;
    const net = sales - expenses;
    if (net > 0 && net >= sales * 0.2) score += 20;
    else if (net > 0) score += 10;
    else score -= 15;

    if (overdue > sales * 0.5) score -= 15;
    else if (overdue > sales * 0.2) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  private async calcInventoryScore(businessId: string): Promise<number> {
    const lowStock = await prisma.catalogItem.count({
      where: {
        businessId,
        trackStock: true,
        isActive: true,
        balances: { some: { quantityOnHand: { lte: prisma.inventoryBalance.fields.reorderPoint }, reorderPoint: { gt: 0 } } },
      },
    });

    const totalTracked = await prisma.catalogItem.count({
      where: { businessId, trackStock: true, isActive: true },
    });

    if (totalTracked === 0) return 50;
    const ratio = lowStock / totalTracked;
    let score = 70;
    if (ratio > 0.3) score -= 30;
    else if (ratio > 0.15) score -= 15;
    else if (ratio > 0.05) score -= 5;
    else score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private async calcCustomerScore(businessId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [activeCustomers, totalCustomers, recentSales] = await Promise.all([
      prisma.sale.groupBy({
        by: ["customerId"],
        where: { businessId, customerId: { not: null }, createdAt: { gte: thirtyDaysAgo } },
        _count: true,
      }),
      prisma.customer.count({ where: { businessId } }),
      prisma.sale.aggregate({ where: { businessId, createdAt: { gte: ninetyDaysAgo } }, _count: true }),
    ]);

    if (totalCustomers === 0) return 40;
    const activeRatio = activeCustomers.length / totalCustomers;
    let score = 50;
    if (activeRatio > 0.5) score += 25;
    else if (activeRatio > 0.3) score += 15;
    else if (activeRatio > 0.1) score += 5;
    else score -= 10;

    if (recentSales._count > 0) score += 15;

    return Math.max(0, Math.min(100, score));
  }

  private async calcDebtScore(businessId: string): Promise<number> {
    const now = new Date();
    const credits = await prisma.customerCredit.findMany({
      where: { businessId, balance: { gt: 0 } },
      select: { balance: true, dueDate: true, creditLimit: true },
    });

    if (credits.length === 0) return 85;

    const totalOutstanding = credits.reduce((sum, c) => sum + Number(c.balance), 0);
    const totalLimits = credits.reduce((sum, c) => sum + Number(c.creditLimit || c.balance), 0);
    const overdueCount = credits.filter((c) => c.dueDate && c.dueDate < now).length;
    const overdue90Plus = credits.filter(
      (c) => c.dueDate && (now.getTime() - c.dueDate.getTime()) > 90 * 24 * 60 * 60 * 1000,
    ).length;

    let score = 60;
    const utilization = totalLimits > 0 ? (totalOutstanding / totalLimits) * 100 : 0;
    if (utilization > 80) score -= 20;
    else if (utilization > 50) score -= 10;

    const overdueRatio = credits.length > 0 ? overdueCount / credits.length : 0;
    if (overdueRatio > 0.5) score -= 20;
    else if (overdueRatio > 0.3) score -= 10;

    if (overdue90Plus > 0) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  private generateSummary(score: number, grade: string): string {
    if (grade === "A") return "Biashara inaendelea vizuri sana. Endelea na mwelekeo huu.";
    if (grade === "B") return "Biashara inaendelea vizuri. Kuna maeneo machache ya kuboresha.";
    if (grade === "C") return "Biashara inaendelea wastani. Angalia maeneo yenye alama chache.";
    if (grade === "D") return "Biashara inahitaji kuboreshwa. Fanya marekebisho haraka.";
    return "Biashara iko hatarini. Chukua hatua za haraka kuboresha hali.";
  }
}

export const healthScoreService = new HealthScoreService();
