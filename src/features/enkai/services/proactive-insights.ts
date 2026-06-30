import "server-only";

import { prisma } from "@/server/db";

export interface ProactiveInsight {
  id: string;
  type: "low_stock" | "overstock" | "sales_drop" | "sales_increase" | "profit_change" | "subscription_expiry" | "customer_inactive" | "lead_inactive" | "commission_anomaly";
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  businessId: string;
  actionLabel?: string;
  actionLink?: string;
}

export async function generateProactiveInsights(businessId: string): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];

  try {
    const lowStockInsight = await checkLowStock(businessId);
    if (lowStockInsight) insights.push(lowStockInsight);

    const salesDropInsight = await checkSalesDrop(businessId);
    if (salesDropInsight) insights.push(salesDropInsight);

    const profitInsight = await checkProfitChange(businessId);
    if (profitInsight) insights.push(profitInsight);

    const subscriptionInsight = await checkSubscriptionExpiry(businessId);
    if (subscriptionInsight) insights.push(subscriptionInsight);

    const inactiveCustomers = await checkInactiveCustomers(businessId);
    insights.push(...inactiveCustomers);
  } catch (err) {
    console.error("Failed to generate proactive insights:", err);
  }

  return insights;
}

async function checkLowStock(businessId: string): Promise<ProactiveInsight | null> {
  const lowStockItems = await prisma.catalogItem.findMany({
    where: {
      businessId,
      trackStock: true,
      isActive: true,
      balances: {
        some: {
          quantityOnHand: { lte: prisma.inventoryBalance.fields.reorderPoint },
          reorderPoint: { gt: 0 },
        },
      },
    },
    include: { balances: true },
    take: 5,
  });

  if (lowStockItems.length === 0) return null;

  const names = lowStockItems.map((i) => i.name).join(", ");
  return {
    id: `low_stock_${Date.now()}`,
    type: "low_stock",
    title: "Stock Inaisha",
    description: `Bidhaa hizi zinaisha: ${names}. Inashauriwa kuongeza stock.`,
    severity: lowStockItems.length > 3 ? "high" : "medium",
    businessId,
    actionLabel: "Angalia Stock",
    actionLink: `/workspaces/businesses/${businessId}/commerce/inventory`,
  };
}

async function checkSalesDrop(businessId: string): Promise<ProactiveInsight | null> {
  const now = new Date();
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [thisWeekSales, lastWeekSales] = await Promise.all([
    prisma.sale.aggregate({
      where: { businessId, createdAt: { gte: thisWeek } },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { businessId, createdAt: { gte: lastWeek, lt: thisWeek } },
      _sum: { total: true },
    }),
  ]);

  const thisTotal = Number(thisWeekSales._sum.total || 0);
  const lastTotal = Number(lastWeekSales._sum.total || 0);

  if (lastTotal > 0 && thisTotal < lastTotal) {
    const dropPercent = ((lastTotal - thisTotal) / lastTotal) * 100;
    if (dropPercent > 10) {
      return {
        id: `sales_drop_${Date.now()}`,
        type: "sales_drop",
        title: "Mauzo Yamepungua",
        description: `Mauzo ya wiki hii yamepungua kwa ${dropPercent.toFixed(0)}% ukilinganisha na wiki iliyopita.`,
        severity: dropPercent > 20 ? "high" : "medium",
        businessId,
        actionLabel: "Angalia Ripoti",
        actionLink: `/workspaces/businesses/${businessId}/commerce/sales`,
      };
    }
  }

  return null;
}

async function checkProfitChange(businessId: string): Promise<ProactiveInsight | null> {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [thisMonthSales, lastMonthSales] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId, createdAt: { gte: thisMonth, lt: nextMonth } },
      include: { items: { include: { catalogItem: { select: { costPrice: true } } } } },
    }),
    prisma.sale.findMany({
      where: { businessId, createdAt: { gte: lastMonth, lt: thisMonth } },
      include: { items: { include: { catalogItem: { select: { costPrice: true } } } } },
    }),
  ]);

  function calcProfit(sales: typeof thisMonthSales): { revenue: number; cost: number; profit: number } {
    let revenue = 0, cost = 0;
    for (const sale of sales) {
      revenue += Number(sale.total);
      for (const item of sale.items) {
        cost += Number(item.quantity) * Number(item.catalogItem.costPrice || 0);
      }
    }
    return { revenue, cost, profit: revenue - cost };
  }

  const thisP = calcProfit(thisMonthSales);
  const lastP = calcProfit(lastMonthSales);

  if (lastP.profit > 0) {
    const changePercent = ((thisP.profit - lastP.profit) / lastP.profit) * 100;
    if (Math.abs(changePercent) > 10) {
      return {
        id: `profit_change_${Date.now()}`,
        type: "profit_change",
        title: changePercent > 0 ? "Faida Imeongezeka" : "Faida Imepungua",
        description: changePercent > 0
          ? `Faida imeongezeka kwa ${changePercent.toFixed(0)}% mwezi huu.`
          : `Faida imepungua kwa ${Math.abs(changePercent).toFixed(0)}% mwezi huu.`,
        severity: changePercent > 0 ? "low" : "high",
        businessId,
        actionLabel: "Angalia Ripoti",
        actionLink: `/workspaces/businesses/${businessId}/commerce/sales`,
      };
    }
  }

  return null;
}

async function checkSubscriptionExpiry(businessId: string): Promise<ProactiveInsight | null> {
  const subscription = await prisma.subscription.findFirst({
    where: { businessId, status: { in: ["active", "grace"] } },
    orderBy: { endDate: "desc" },
  });

  if (!subscription || !subscription.endDate) return null;

  const daysLeft = Math.ceil((subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 7 && daysLeft > 0) {
    return {
      id: `sub_expiry_${Date.now()}`,
      type: "subscription_expiry",
      title: "Usajili Unaisha",
      description: `Usajili wako unaisha ndani ya siku ${daysLeft}. Tafadhali lipia ili kuendelea kutumia huduma.`,
      severity: daysLeft <= 3 ? "high" : "medium",
      businessId,
      actionLabel: "Angalia Usajili",
      actionLink: `/workspaces/settings`,
    };
  }

  return null;
}

async function checkInactiveCustomers(businessId: string): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];
  const daysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);

  const inactiveCustomers = await prisma.customer.findMany({
    where: {
      businessId,
      sales: { none: { createdAt: { gte: daysAgo } } },
      createdAt: { lt: daysAgo },
    },
    take: 3,
    select: { id: true, firstName: true, lastName: true },
  });

  for (const customer of inactiveCustomers) {
    const name = `${customer.firstName} ${customer.lastName || ""}`.trim();
    insights.push({
      id: `inactive_cust_${customer.id}`,
      type: "customer_inactive",
      title: "Mteja Hajafanya Manunuzi",
      description: `${name} hajafanya manunuzi kwa siku 45+. Jaribu kumwasiliana.`,
      severity: "medium",
      businessId,
      actionLabel: "Angalia Mteja",
      actionLink: `/workspaces/businesses/${businessId}/commerce/customers`,
    });
  }

  return insights;
}
