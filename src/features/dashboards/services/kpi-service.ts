import "server-only";

import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import type { PlatformKPIs, BusinessKPIs } from "../types";

export async function getPlatformKPIs(period: "current" | "prev" = "current"): Promise<PlatformKPIs> {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const createdAtFilter = period === "prev"
    ? { createdAt: { gte: prevMonthStart, lte: prevMonthEnd } }
    : {};
  const paidAtFilter = period === "prev"
    ? { createdAt: { gte: prevMonthStart, lte: prevMonthEnd } }
    : {};

  const [totalWorkspaces, totalBusinesses, totalUsers, revenueData, activeSubscriptions, pendingTickets] =
    await Promise.all([
      prisma.workspace.count({ where: { isActive: true, ...createdAtFilter } }),
      prisma.business.count({ where: { isActive: true, ...createdAtFilter } }),
      prisma.user.count({ where: { isActive: true, ...createdAtFilter } }),
      prisma.payment.aggregate({
        where: { status: "completed", ...paidAtFilter },
        _sum: { amount: true },
      }),
      prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
    ]);

  return {
    totalWorkspaces,
    totalBusinesses,
    totalUsers,
    totalRevenue: Number(revenueData._sum.amount) || 0,
    activeSubscriptions,
    pendingTickets,
  };
}

export async function getBusinessKPIs(
  businessId: string,
  period: "current" | "prev" = "current",
): Promise<BusinessKPIs> {
  const now = new Date();
  const offset = period === "prev" ? -7 : 0;

  const today = new Date(now);
  today.setDate(today.getDate() + offset);
  today.setHours(0, 0, 0, 0);

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const monthStart = period === "prev"
    ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  const monthEnd = period === "prev"
    ? new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    : now;

  const [
    todaySales,
    weeklySales,
    totalCustomers,
    lowStockCount,
    pendingOrders,
    monthlyExpenses,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        businessId,
        status: "completed",
        saleDate: { gte: today },
      },
      _sum: { grandTotal: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: {
        businessId,
        status: "completed",
        saleDate: { gte: weekStart },
      },
      _sum: { grandTotal: true },
    }),
    prisma.customer.count({ where: { businessId, isActive: true } }),
    prisma.inventoryBalance.count({
      where: {
        location: { businessId, isActive: true },
        quantityOnHand: { lte: prisma.inventoryBalance.fields.reorderPoint },
      },
    }),
    prisma.purchaseOrder.count({
      where: { businessId, status: { in: ["draft", "sent"] } },
    }),
    prisma.expense.aggregate({
      where: {
        businessId,
        status: { in: ["approved", "paid"] },
        expenseDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    todaySales: Number(todaySales._sum.grandTotal) || 0,
    weeklyRevenue: Number(weeklySales._sum.grandTotal) || 0,
    totalCustomers,
    lowStockCount,
    pendingOrders,
    monthlyExpenses: Number(monthlyExpenses._sum.amount) || 0,
  };
}
