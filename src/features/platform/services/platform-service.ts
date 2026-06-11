import "server-only";

import { prisma } from "@/server/db";
import type { PlatformStats } from "../types";

export async function getPlatformStats(): Promise<PlatformStats> {
  const [totalBusinesses, totalUsers, totalStaff, totalSales, activeSubscriptions, pendingLeads, openSupportTickets] = await Promise.all([
    prisma.business.count(),
    prisma.user.count(),
    prisma.staff.count(),
    prisma.sale.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
  ]);

  const revenueAgg = await prisma.sale.aggregate({
    _sum: { total: true },
  });

  return {
    totalBusinesses,
    totalUsers,
    totalStaff,
    totalSales,
    totalRevenue: revenueAgg._sum.total || 0,
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

  const where = options?.search
    ? {
        OR: [
          { email: { contains: options.search, mode: "insensitive" as const } },
          { firstName: { contains: options.search, mode: "insensitive" as const } },
          { lastName: { contains: options.search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        userRoles: { include: { role: true } },
        workspaceMemberships: { include: { workspace: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit };
}
