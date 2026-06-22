"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { serialize } from "@/lib/utils";

export async function getMySalesProfile() {
  const user = await requireAuth();
  const profile = await prisma.salesProfile.findUnique({
    where: { userId: user.id },
    include: {
      hierarchy: true,
      manager: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
    },
  });
  return serialize(profile);
}

export async function getMySalesStats() {
  const user = await requireAuth();
  const profile = await prisma.salesProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return null;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todaySales, weekSales, monthSales, recentSales] = await Promise.all([
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      _count: true,
      where: {
        salesProfileId: profile.id,
        status: { not: "CANCELLED" },
        createdAt: { gte: startOfDay },
      },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      _count: true,
      where: {
        salesProfileId: profile.id,
        status: { not: "CANCELLED" },
        createdAt: { gte: startOfWeek },
      },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      _count: true,
      where: {
        salesProfileId: profile.id,
        status: { not: "CANCELLED" },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.commissionLedger.findMany({
      where: { salesProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return serialize({
    today: { amount: Number(todaySales._sum.amount) || 0, count: todaySales._count },
    week: { amount: Number(weekSales._sum.amount) || 0, count: weekSales._count },
    month: { amount: Number(monthSales._sum.amount) || 0, count: monthSales._count },
    recent: recentSales,
  });
}

export async function getMyClients() {
  const user = await requireAuth();
  const profile = await prisma.salesProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return [];

  const convertedLeads = await prisma.lead.findMany({
    where: {
      assignedToId: profile.id,
      status: "CONVERTED",
    },
    orderBy: { convertedAt: "desc" },
  });

  const businesses = await prisma.business.findMany({
    where: {
      createdById: user.id,
    },
    orderBy: { createdAt: "desc" },
  });

  return serialize({ convertedLeads, businesses });
}

export async function getMyCommissionMetrics() {
  const user = await requireAuth();
  const profile = await prisma.salesProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return null;

  const [totalEarned, totalApproved, totalPaid, totalPending] = await Promise.all([
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { salesProfileId: profile.id, status: { not: "CANCELLED" } },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { salesProfileId: profile.id, status: "APPROVED" },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { salesProfileId: profile.id, status: "PAID" },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { salesProfileId: profile.id, status: "PENDING" },
    }),
  ]);

  return serialize({
    totalEarned: Number(totalEarned._sum.amount) || 0,
    totalApproved: Number(totalApproved._sum.amount) || 0,
    totalPaid: Number(totalPaid._sum.amount) || 0,
    totalPending: Number(totalPending._sum.amount) || 0,
  });
}

export async function getMyCommissionEntries() {
  const user = await requireAuth();
  const profile = await prisma.salesProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return [];

  const entries = await prisma.commissionLedger.findMany({
    where: { salesProfileId: profile.id },
    include: { payout: { select: { id: true, amount: true, paidAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return serialize(entries);
}

export async function getMyPerformanceMetrics() {
  const user = await requireAuth();
  const profile = await prisma.salesProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    totalLeads,
    convertedLeads,
    monthLeads,
    totalCommissions,
    yearCommissions,
    monthCommissions,
  ] = await Promise.all([
    prisma.lead.count({ where: { assignedToId: profile.id } }),
    prisma.lead.count({ where: { assignedToId: profile.id, status: "CONVERTED" } }),
    prisma.lead.count({
      where: { assignedToId: profile.id, createdAt: { gte: startOfMonth } },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: { salesProfileId: profile.id, status: { not: "CANCELLED" } },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: {
        salesProfileId: profile.id,
        status: { not: "CANCELLED" },
        createdAt: { gte: startOfYear },
      },
    }),
    prisma.commissionLedger.aggregate({
      _sum: { amount: true },
      where: {
        salesProfileId: profile.id,
        status: { not: "CANCELLED" },
        createdAt: { gte: startOfMonth },
      },
    }),
  ]);

  const activeClients = await prisma.lead.count({
    where: { assignedToId: profile.id, status: "CONVERTED" },
  });

  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  return serialize({
    totalLeads,
    convertedLeads,
    conversionRate: Number(conversionRate.toFixed(1)),
    activeClients,
    monthLeads,
    totalCommissions: Number(totalCommissions._sum.amount) || 0,
    yearCommissions: Number(yearCommissions._sum.amount) || 0,
    monthCommissions: Number(monthCommissions._sum.amount) || 0,
  });
}

export async function getMyLeadMetrics() {
  const user = await requireAuth();
  const profile = await prisma.salesProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return null;

  const statusCounts = await prisma.lead.groupBy({
    by: ["status"],
    where: { assignedToId: profile.id },
    _count: { id: true },
  });
  const totalLeads = await prisma.lead.count({ where: { assignedToId: profile.id } });

  return serialize({ statusCounts, totalLeads });
}

export async function getMyMonthlySalesHistory() {
  const user = await requireAuth();
  const profile = await prisma.salesProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return [];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const entries = await prisma.commissionLedger.findMany({
    where: {
      salesProfileId: profile.id,
      status: { not: "CANCELLED" },
      createdAt: { gte: sixMonthsAgo },
    },
    orderBy: { createdAt: "asc" },
  });

  const monthlyMap: Record<string, { month: string; amount: number; count: number }> = {};

  for (const entry of entries) {
    const d = new Date(entry.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    if (!monthlyMap[key]) {
      monthlyMap[key] = { month: label, amount: 0, count: 0 };
    }
    monthlyMap[key].amount += Number(entry.amount);
    monthlyMap[key].count += 1;
  }

  return Object.values(monthlyMap);
}

export async function getMyTargetsAction() {
  await requireAuth();
  return {
    monthlyLeads: 10,
    conversionRate: 30,
    monthlyCommission: 500000,
    yearlyCommission: 5000000,
  };
}
