import "server-only";

import { prisma } from "@/server/db";

export interface PlatformDashboardStats {
  totalUsers: number;
  totalWorkspaces: number;
  totalBusinesses: number;
  activeBusinesses: number;
  totalSales: number;
  recentSignups: number;
  platformRevenue: number;
  activeSubscriptions: number;
  pendingSupportTickets: number;
}

export async function getPlatformStats(): Promise<PlatformDashboardStats> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, totalWorkspaces, totalBusinesses, activeBusinesses, totalSales, recentSignups, subscriptions, activeSubscriptions, pendingTickets] =
    await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.business.count(),
      prisma.business.count({ where: { isActive: true } }),
      prisma.sale.aggregate({ _sum: { grandTotal: true } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.subscriptionPayment.aggregate({ _sum: { amount: true } }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
    ]);

  return {
    totalUsers,
    totalWorkspaces,
    totalBusinesses,
    activeBusinesses,
    totalSales: Number(totalSales._sum.grandTotal || 0),
    recentSignups,
    platformRevenue: Number(subscriptions._sum.amount || 0),
    activeSubscriptions,
    pendingSupportTickets: pendingTickets,
  };
}
