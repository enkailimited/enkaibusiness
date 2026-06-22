import "server-only";

import { prisma } from "@/server/db";

export interface SalesSummary {
  total: number;
  count: number;
  average: number;
  profit: number;
  margin: number;
  comparison?: { change: number; percent: number };
}

export interface ProductAnalytic {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  trend: "up" | "down" | "stable";
}

export interface CustomerAnalytic {
  id: string;
  name: string;
  totalSales: number;
  visitCount: number;
  averageOrder: number;
  lastPurchase: Date | null;
  risk: "high" | "medium" | "low";
}

export interface BranchAnalytic {
  id: string;
  name: string;
  sales: number;
  count: number;
  profit: number;
  margin: number;
  share: number;
}

export interface SalespersonAnalytic {
  id: string;
  name: string;
  sales: number;
  count: number;
  average: number;
  target: number;
  achievement: number;
}

export interface RevenueInsight {
  type: "opportunity" | "risk" | "recommendation";
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  metric?: number;
}

export class RevenueEngine {
  async getDailySummary(businessId: string, date?: Date): Promise<SalesSummary> {
    const day = date || new Date();
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const yesterdayStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);

    const [today, yesterday, items] = await Promise.all([
      prisma.sale.aggregate({
        where: { businessId, createdAt: { gte: start, lt: end } },
        _sum: { total: true, profit: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { businessId, createdAt: { gte: yesterdayStart, lt: start } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.saleItem.findMany({
        where: { sale: { businessId, createdAt: { gte: start, lt: end } } },
        include: { catalogItem: { select: { costPrice: true } } },
      }),
    ]);

    const revenue = Number(today._sum.total || 0);
    const cost = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.catalogItem.costPrice || 0), 0);
    const profit = Number(today._sum.profit || 0) || revenue - cost;
    const yTotal = Number(yesterday._sum.total || 0);
    const change = yTotal > 0 ? ((revenue - yTotal) / yTotal) * 100 : 0;

    return {
      total: revenue,
      count: today._count,
      average: today._count > 0 ? revenue / today._count : 0,
      profit,
      margin: revenue > 0 ? (profit / revenue) * 100 : 0,
      comparison: { change: revenue - yTotal, percent: Math.round(change) },
    };
  }

  async getWeeklySummary(businessId: string): Promise<SalesSummary> {
    const now = new Date();
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [current, previous, items] = await Promise.all([
      prisma.sale.aggregate({
        where: { businessId, createdAt: { gte: thisWeek } },
        _sum: { total: true, profit: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { businessId, createdAt: { gte: lastWeek, lt: thisWeek } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.saleItem.findMany({
        where: { sale: { businessId, createdAt: { gte: thisWeek } } },
        include: { catalogItem: { select: { costPrice: true } } },
      }),
    ]);

    const revenue = Number(current._sum.total || 0);
    const cost = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.catalogItem.costPrice || 0), 0);
    const profit = Number(current._sum.profit || 0) || revenue - cost;
    const prevTotal = Number(previous._sum.total || 0);
    const change = prevTotal > 0 ? ((revenue - prevTotal) / prevTotal) * 100 : 0;

    return {
      total: revenue,
      count: current._count,
      average: current._count > 0 ? revenue / current._count : 0,
      profit,
      margin: revenue > 0 ? (profit / revenue) * 100 : 0,
      comparison: { change: revenue - prevTotal, percent: Math.round(change) },
    };
  }

  async getMonthlySummary(businessId: string): Promise<SalesSummary> {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [current, previous, items] = await Promise.all([
      prisma.sale.aggregate({
        where: { businessId, createdAt: { gte: thisMonth, lt: nextMonth } },
        _sum: { total: true, profit: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { businessId, createdAt: { gte: lastMonth, lt: thisMonth } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.saleItem.findMany({
        where: { sale: { businessId, createdAt: { gte: thisMonth, lt: nextMonth } } },
        include: { catalogItem: { select: { costPrice: true } } },
      }),
    ]);

    const revenue = Number(current._sum.total || 0);
    const cost = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.catalogItem.costPrice || 0), 0);
    const profit = Number(current._sum.profit || 0) || revenue - cost;
    const prevTotal = Number(previous._sum.total || 0);
    const change = prevTotal > 0 ? ((revenue - prevTotal) / prevTotal) * 100 : 0;

    return {
      total: revenue,
      count: current._count,
      average: current._count > 0 ? revenue / current._count : 0,
      profit,
      margin: revenue > 0 ? (profit / revenue) * 100 : 0,
      comparison: { change: revenue - prevTotal, percent: Math.round(change) },
    };
  }

  async getTopProducts(businessId: string, limit = 10): Promise<ProductAnalytic[]> {
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

    const itemSales = await prisma.saleItem.groupBy({
      by: ["catalogItemId"],
      where: { sale: { businessId, createdAt: { gte: thisMonth, lt: nextMonth } } },
      _sum: { quantity: true, total: true },
      _count: true,
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    if (itemSales.length === 0) return [];

    const ids = itemSales.map((i) => i.catalogItemId);
    const products = await prisma.catalogItem.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, costPrice: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const prevItemSales = await prisma.saleItem.groupBy({
      by: ["catalogItemId"],
      where: { sale: { businessId, createdAt: { gte: lastMonth, lt: thisMonth } }, catalogItemId: { in: ids } },
      _sum: { quantity: true },
    });
    const prevQuantMap = new Map(prevItemSales.map((i) => [i.catalogItemId, Number(i._sum.quantity || 0)]));

    return itemSales.map((item) => {
      const product = productMap.get(item.catalogItemId);
      const revenue = Number(item._sum.total || 0);
      const qty = Number(item._sum.quantity || 0);
      const cost = qty * Number(product?.costPrice || 0);
      const profit = revenue - cost;
      const prevQty = prevQuantMap.get(item.catalogItemId) || 0;
      let trend: "up" | "down" | "stable" = "stable";
      if (prevQty > 0 && qty > prevQty * 1.1) trend = "up";
      else if (prevQty > 0 && qty < prevQty * 0.9) trend = "down";

      return {
        id: item.catalogItemId,
        name: product?.name || "Unknown",
        quantity: qty,
        revenue,
        cost,
        profit,
        margin: revenue > 0 ? (profit / revenue) * 100 : 0,
        trend,
      };
    });
  }

  async getTopCustomers(businessId: string, limit = 10): Promise<CustomerAnalytic[]> {
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

    const customerSales = await prisma.sale.groupBy({
      by: ["customerId"],
      where: { businessId, customerId: { not: null }, createdAt: { gte: thisMonth, lt: nextMonth } },
      _sum: { total: true },
      _count: true,
      _max: { createdAt: true },
      orderBy: { _sum: { total: "desc" } },
      take: limit,
    });

    if (customerSales.length === 0) return [];

    const ids = customerSales.map((c) => c.customerId!).filter(Boolean);
    const customers = await prisma.customer.findMany({
      where: { id: { in: ids } },
      select: { id: true, firstName: true, lastName: true },
    });
    const customerMap = new Map(customers.map((c) => [c.id, `${c.firstName} ${c.lastName || ""}`.trim()]));

    return customerSales.map((c) => {
      const total = Number(c._sum.total || 0);
      return {
        id: c.customerId!,
        name: customerMap.get(c.customerId!) || "Unknown",
        totalSales: total,
        visitCount: c._count,
        averageOrder: c._count > 0 ? total / c._count : 0,
        lastPurchase: c._max.createdAt,
        risk: c._count < 2 ? "high" : c._count < 5 ? "medium" : "low",
      };
    });
  }

  async getBranchPerformance(businessId: string): Promise<BranchAnalytic[]> {
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

    const branchSales = await prisma.sale.groupBy({
      by: ["branchId"],
      where: { businessId, branchId: { not: null }, createdAt: { gte: thisMonth, lt: nextMonth } },
      _sum: { total: true, profit: true },
      _count: true,
    });

    if (branchSales.length === 0) return [];

    const ids = branchSales.map((b) => b.branchId!).filter(Boolean);
    const branches = await prisma.branch.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const branchMap = new Map(branches.map((b) => [b.id, b.name]));

    const totalRevenue = branchSales.reduce((sum, b) => sum + Number(b._sum.total || 0), 0);

    return branchSales.map((b) => {
      const sales = Number(b._sum.total || 0);
      const profit = Number(b._sum.profit || 0);
      return {
        id: b.branchId!,
        name: branchMap.get(b.branchId!) || "Unknown",
        sales,
        count: b._count,
        profit,
        margin: sales > 0 ? (profit / sales) * 100 : 0,
        share: totalRevenue > 0 ? (sales / totalRevenue) * 100 : 0,
      };
    }).sort((a, b) => b.sales - a.sales);
  }

  async generateInsights(businessId: string): Promise<RevenueInsight[]> {
    const insights: RevenueInsight[] = [];

    const [daily, weekly, monthly, topProducts, branchPerf] = await Promise.all([
      this.getDailySummary(businessId),
      this.getWeeklySummary(businessId),
      this.getMonthlySummary(businessId),
      this.getTopProducts(businessId, 5),
      this.getBranchPerformance(businessId),
    ]);

    if (weekly.comparison && weekly.comparison.percent < -10) {
      insights.push({
        type: "risk",
        title: "Mauzo Yamepungua",
        description: `Mauzo ya wiki hii yamepungua kwa ${Math.abs(weekly.comparison.percent)}% ukilinganisha na wiki iliyopita.`,
        severity: weekly.comparison.percent < -20 ? "high" : "medium",
        metric: weekly.comparison.percent,
      });
    }

    if (weekly.comparison && weekly.comparison.percent > 15) {
      insights.push({
        type: "opportunity",
        title: "Mauzo Yameongezeka",
        description: `Mauzo ya wiki hii yameongezeka kwa ${weekly.comparison.percent}%. Endelea na mwelekeo huu.`,
        severity: "low",
        metric: weekly.comparison.percent,
      });
    }

    const decliningProducts = topProducts.filter((p) => p.trend === "down").slice(0, 3);
    if (decliningProducts.length > 0) {
      insights.push({
        type: "risk",
        title: "Bidhaa Zinapungua Mauzo",
        description: `Bidhaa hizi zimepungua mauzo: ${decliningProducts.map((p) => p.name).join(", ")}.`,
        severity: "medium",
      });
    }

    const topProduct = topProducts[0];
    if (topProduct) {
      insights.push({
        type: "recommendation",
        title: "Bidhaa Inayoongoza",
        description: `${topProduct.name} ndiyo bidhaa inayouza zaidi mwezi huu (${topProduct.quantity} vitengo). Hakikisha stoo haisha.`,
        severity: "low",
        metric: topProduct.quantity,
      });
    }

    if (daily.margin < 10) {
      insights.push({
        type: "risk",
        title: "Faida Ndogo",
        description: `Faida ya leo ni ${daily.margin.toFixed(0)}% tu. Angalia gharama za bidhaa au ongeza bei.`,
        severity: "high",
        metric: daily.margin,
      });
    }

    if (branchPerf.length > 0) {
      const topBranch = branchPerf[0];
      insights.push({
        type: "recommendation",
        title: "Tawi Linaloongoza",
        description: `${topBranch.name} limeongoza kwa mauzo mwezi huu (${topBranch.share.toFixed(0)}% ya mauzo yote).`,
        severity: "low",
        metric: topBranch.share,
      });
    }

    return insights;
  }
}

export const revenueEngine = new RevenueEngine();
