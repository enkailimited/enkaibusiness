import "server-only";

import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import type { PlatformStats } from "../types";
import { searchService } from "@/server/search";

export async function getPlatformStats(): Promise<PlatformStats> {
  const [totalBusinesses, totalUsers, totalStaff, totalSales, activeSubscriptions, pendingLeads, openSupportTickets] = await Promise.all([
    prisma.business.count(),
    prisma.user.count(),
    prisma.staff.count(),
    prisma.sale.count(),
    prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
  ]);

  const revenueAgg = await prisma.sale.aggregate({
    _sum: { grandTotal: true },
  });

  return {
    totalBusinesses,
    totalUsers,
    totalStaff,
    totalSales,
    totalRevenue: revenueAgg._sum?.grandTotal || 0,
    activeSubscriptions,
    pendingLeads,
    openSupportTickets,
  };
}

export async function getRecentActivity(limit = 10) {
  return prisma.activity.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

export async function getPlatformUsers(options?: { search?: string; page?: number; limit?: number }) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  const result = await searchService.users({
    query: options?.search,
    orderBy: { createdAt: "desc" },
    offset: skip,
    limit,
    include: {
      userRoles: { include: { role: true } },
      workspaceMemberships: { include: { workspace: true } },
    },
  });

  return { users: result.items, total: result.total, page, limit };
}
