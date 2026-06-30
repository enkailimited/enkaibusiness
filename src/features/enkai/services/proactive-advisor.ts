import "server-only";

import { prisma } from "@/server/db";

export interface AdvisorNotification {
  id: string;
  type: "low_stock" | "sales_decline" | "overdue_debt" | "subscription_expiry" | "unusual_expense" | "pending_purchase_order";
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  actionLabel?: string;
  actionLink?: string;
}

export interface BusinessSnapshot {
  todaySales: number;
  lowStockCount: number;
  overdueDebtCount: number;
  criticalStockNames: string[];
  topDebtorName?: string;
  topDebtAmount?: number;
  pendingPOCount: number;
}

export async function scanBusiness(businessId: string): Promise<{
  snapshot: BusinessSnapshot;
  notifications: AdvisorNotification[];
}> {
  const [notifications, snapshot] = await Promise.all([
    generateNotifications(businessId),
    generateSnapshot(businessId),
  ]);

  return { snapshot, notifications };
}

async function generateSnapshot(businessId: string): Promise<BusinessSnapshot> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    todaySalesAgg,
    lowStockItems,
    overdueCredits,
    pendingPOs,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { businessId, createdAt: { gte: today } },
      _sum: { total: true },
    }),
    prisma.catalogItem.findMany({
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
      select: { name: true },
      take: 5,
    }),
    prisma.customerCredit.findMany({
      where: {
        businessId,
        balance: { gt: 0 },
        dueDate: { lt: new Date() },
      },
      orderBy: { balance: "desc" },
      take: 1,
      select: {
        balance: true,
        customer: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.purchaseOrder.count({
      where: { businessId, status: { in: ["draft", "sent"] } },
    }),
  ]);

  const topDebtor = overdueCredits[0];

  return {
    todaySales: Number(todaySalesAgg._sum.total || 0),
    lowStockCount: lowStockItems.length,
    overdueDebtCount: overdueCredits.length,
    criticalStockNames: lowStockItems.map((i) => i.name),
    topDebtorName: topDebtor
      ? `${topDebtor.customer?.firstName || ""} ${topDebtor.customer?.lastName || ""}`.trim()
      : undefined,
    topDebtAmount: topDebtor ? Number(topDebtor.balance) : undefined,
    pendingPOCount: pendingPOs,
  };
}

async function generateNotifications(businessId: string): Promise<AdvisorNotification[]> {
  const notifications: AdvisorNotification[] = [];
  const id = () => `adv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // 1. Low stock
  const lowStock = await prisma.catalogItem.findMany({
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
    select: { name: true, balances: { select: { quantityOnHand: true, reorderPoint: true } } },
    take: 10,
  });
  if (lowStock.length > 0) {
    const names = lowStock.map((i) => i.name).join(", ");
    notifications.push({
      id: id(),
      type: "low_stock",
      title: "Stock Inaisha",
      description: `Bidhaa hizi zinaisha: ${names}. Inashauriwa kuongeza stock.`,
      severity: lowStock.length > 3 ? "high" : "medium",
      actionLabel: "Angalia Stock",
      actionLink: `/workspaces/businesses/${businessId}/commerce/inventory`,
    });
  }

  // 2. Sales decline (this week vs last week)
  const now = new Date();
  const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [thisWeekAgg, lastWeekAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: { businessId, createdAt: { gte: thisWeekStart } },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { businessId, createdAt: { gte: lastWeekStart, lt: thisWeekStart } },
      _sum: { total: true },
    }),
  ]);

  const thisTotal = Number(thisWeekAgg._sum.total || 0);
  const lastTotal = Number(lastWeekAgg._sum.total || 0);
  if (lastTotal > 0 && thisTotal < lastTotal) {
    const dropPct = ((lastTotal - thisTotal) / lastTotal) * 100;
    if (dropPct > 10) {
      notifications.push({
        id: id(),
        type: "sales_decline",
        title: "Mauzo Yamepungua",
        description: `Mauzo ya wiki hii yamepungua kwa ${dropPct.toFixed(0)}% ukilinganisha na wiki iliyopita.`,
        severity: dropPct > 20 ? "high" : "medium",
        actionLabel: "Angalia Ripoti",
        actionLink: `/workspaces/businesses/${businessId}/commerce/sales`,
      });
    }
  }

  // 3. Overdue debts
  const overdueCredits = await prisma.customerCredit.findMany({
    where: {
      businessId,
      balance: { gt: 0 },
      dueDate: { lt: new Date() },
    },
    orderBy: { balance: "desc" },
    take: 3,
    select: {
      balance: true,
      dueDate: true,
      customer: { select: { firstName: true, lastName: true } },
    },
  });
  for (const credit of overdueCredits) {
    const name = `${credit.customer?.firstName || ""} ${credit.customer?.lastName || ""}`.trim();
    const daysOverdue = Math.ceil((Date.now() - credit.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    notifications.push({
      id: id(),
      type: "overdue_debt",
      title: "Deni Halijalipwa",
      description: `${name} ana deni la Tsh ${Number(credit.balance).toLocaleString()} ambalo limechelewa siku ${daysOverdue}.`,
      severity: daysOverdue > 60 ? "high" : "medium",
      actionLabel: "Angalia Mikopo",
      actionLink: `/workspaces/businesses/${businessId}/commerce/invoices`,
    });
  }

  // 4. Subscription expiry
  const subscription = await prisma.subscription.findFirst({
    where: { businessId, status: { in: ["active", "grace"] } },
    orderBy: { endDate: "desc" },
    select: { endDate: true },
  });
  if (subscription?.endDate) {
    const daysLeft = Math.ceil((subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7 && daysLeft > 0) {
      notifications.push({
        id: id(),
        type: "subscription_expiry",
        title: "Usajili Unaisha",
        description: `Usajili wako unaisha ndani ya siku ${daysLeft}. Lipia ili kuendelea.`,
        severity: daysLeft <= 3 ? "high" : "medium",
        actionLabel: "Angalia Usajili",
        actionLink: `/workspaces/settings`,
      });
    }
  }

  // 5. Pending purchase orders
  if (notifications.some((n) => n.type === "pending_purchase_order")) {
    // already added above
  } else {
    const pendingPOs = await prisma.purchaseOrder.count({
      where: { businessId, status: { in: ["draft", "sent"] } },
    });
    if (pendingPOs > 0) {
      notifications.push({
        id: id(),
        type: "pending_purchase_order",
        title: "Purchase Order Inasubiri",
        description: `Kuna purchase order ${pendingPOs} ambazo hazijakamilika.`,
        severity: "medium",
        actionLabel: "Angalia PO",
        actionLink: `/workspaces/businesses/${businessId}/commerce/purchases`,
      });
    }
  }

  return notifications;
}

export async function getLoginGreetingData(businessId: string, userId: string): Promise<{
  userName: string;
  businessName: string;
  snapshot: BusinessSnapshot;
}> {
  const [user, business, snapshot] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    }),
    prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true },
    }),
    generateSnapshot(businessId),
  ]);

  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Mfanyabiashara";

  return {
    userName,
    businessName: business?.name || "Biashara",
    snapshot,
  };
}
