import "server-only";

import type { RoleDashboard, DashboardWidget, KPIData } from "../types";
import { PLATFORM_LAYOUT, BUSINESS_LAYOUT } from "../constants";
import { getPlatformKPIs, getBusinessKPIs } from "./kpi-service";
import { prisma } from "@/server/db";

export async function getDashboard(
  role: "platform" | "business",
  businessId?: string,
): Promise<RoleDashboard> {
  if (role === "platform") {
    const [kpis, prevKpis] = await Promise.all([
      getPlatformKPIs(),
      getPlatformKPIs("prev"),
    ]);

    const pctChange = (curr: number, prev: number): number | null => {
      if (prev === 0) return null;
      return Math.round(((curr - prev) / prev) * 100);
    };
    const trend = (curr: number, prev: number): "up" | "down" | "neutral" | null => {
      if (prev === 0) return null;
      if (curr > prev) return "up";
      if (curr < prev) return "down";
      return "neutral";
    };

    const widgets: DashboardWidget[] = [
      {
        type: "kpi",
        title: "Platform KPIs",
        data: [
          { label: "Workspaces", value: kpis.totalWorkspaces, change: pctChange(kpis.totalWorkspaces, prevKpis.totalWorkspaces), trend: trend(kpis.totalWorkspaces, prevKpis.totalWorkspaces) },
          { label: "Businesses", value: kpis.totalBusinesses, change: pctChange(kpis.totalBusinesses, prevKpis.totalBusinesses), trend: trend(kpis.totalBusinesses, prevKpis.totalBusinesses) },
          { label: "Users", value: kpis.totalUsers, change: pctChange(kpis.totalUsers, prevKpis.totalUsers), trend: trend(kpis.totalUsers, prevKpis.totalUsers) },
          { label: "Revenue", value: kpis.totalRevenue, change: pctChange(kpis.totalRevenue, prevKpis.totalRevenue), trend: trend(kpis.totalRevenue, prevKpis.totalRevenue) },
          { label: "Subscriptions", value: kpis.activeSubscriptions, change: pctChange(kpis.activeSubscriptions, prevKpis.activeSubscriptions), trend: trend(kpis.activeSubscriptions, prevKpis.activeSubscriptions) },
          { label: "Pending Tickets", value: kpis.pendingTickets, change: pctChange(kpis.pendingTickets, prevKpis.pendingTickets), trend: trend(kpis.pendingTickets, prevKpis.pendingTickets) },
        ],
      },
      {
        type: "subscriptions",
        title: "Active Subscriptions",
        data: { count: kpis.activeSubscriptions },
      },
      {
        type: "revenue-summary",
        title: "Platform Revenue",
        data: { total: kpis.totalRevenue },
      },
    ];

    return { role: "platform", layout: { ...PLATFORM_LAYOUT, widgets } };
  }

  if (!businessId) {
    return { role: "business", layout: BUSINESS_LAYOUT };
  }

  const [kpis, prevKpis] = await Promise.all([
    getBusinessKPIs(businessId),
    getBusinessKPIs(businessId, "prev"),
  ]);

  const pctChange = (curr: number, prev: number): number | null => {
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  };
  const trend = (curr: number, prev: number): "up" | "down" | "neutral" | null => {
    if (prev === 0) return null;
    if (curr > prev) return "up";
    if (curr < prev) return "down";
    return "neutral";
  };

  const recentSales = await prisma.sale.findMany({
    where: { businessId, status: "completed" },
    orderBy: { saleDate: "desc" },
    take: 5,
    select: {
      id: true,
      reference: true,
      grandTotal: true,
      saleDate: true,
      customer: { select: { firstName: true, lastName: true } },
    },
  });

  const topProducts = await prisma.saleItem.groupBy({
    by: ["catalogItemId"],
    where: { sale: { businessId, status: "completed" } },
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { subtotal: "desc" } },
    take: 5,
  });

  const productIds = topProducts.map((p) => p.catalogItemId);
  const productMap = new Map<string, string>();
  if (productIds.length > 0) {
    const products = await prisma.catalogItem.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    for (const p of products) {
      productMap.set(p.id, p.name);
    }
  }

  const widgets: DashboardWidget[] = [
    {
      type: "kpi",
      title: "Business KPIs",
      data: [
        { label: "Today Sales", value: kpis.todaySales, change: pctChange(kpis.todaySales, prevKpis.todaySales), trend: trend(kpis.todaySales, prevKpis.todaySales) },
        { label: "Weekly Revenue", value: kpis.weeklyRevenue, change: pctChange(kpis.weeklyRevenue, prevKpis.weeklyRevenue), trend: trend(kpis.weeklyRevenue, prevKpis.weeklyRevenue) },
        { label: "Customers", value: kpis.totalCustomers, change: pctChange(kpis.totalCustomers, prevKpis.totalCustomers), trend: trend(kpis.totalCustomers, prevKpis.totalCustomers) },
        { label: "Low Stock Items", value: kpis.lowStockCount, change: null, trend: kpis.lowStockCount > 0 ? "up" : "neutral" },
        { label: "Pending Orders", value: kpis.pendingOrders, change: null, trend: kpis.pendingOrders > 0 ? "up" : "neutral" },
        { label: "Monthly Expenses", value: kpis.monthlyExpenses, change: pctChange(kpis.monthlyExpenses, prevKpis.monthlyExpenses), trend: trend(kpis.monthlyExpenses, prevKpis.monthlyExpenses) },
      ],
    },
    {
      type: "sales-chart",
      title: "Sales Trend",
      data: { recentSales: recentSales.map((s) => ({ ...s, grandTotal: Number(s.grandTotal) })) },
    },
    {
      type: "top-products",
      title: "Top Products",
      data: topProducts.map((p) => ({
        name: productMap.get(p.catalogItemId) ?? "Unknown",
        quantity: Number(p._sum.quantity) || 0,
        revenue: Number(p._sum.subtotal) || 0,
      })),
    },
  ];

  return { role: "business", layout: { ...BUSINESS_LAYOUT, widgets } };
}
