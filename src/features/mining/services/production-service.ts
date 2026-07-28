import "server-only";
import { prisma } from "@/server/db";
import type { MiningProductionLogInput } from "../schemas";
import type { Prisma } from "@prisma/client";

export async function listProductionLogs(
  businessId: string,
  filters?: { siteId?: string; startDate?: string; endDate?: string },
) {
  const where: Prisma.MiningProductionLogWhereInput = { businessId };

  if (filters?.siteId) where.siteId = filters.siteId;
  if (filters?.startDate || filters?.endDate) {
    where.productionDate = {};
    if (filters.startDate) where.productionDate.gte = new Date(filters.startDate);
    if (filters.endDate) where.productionDate.lte = new Date(filters.endDate);
  }

  return prisma.miningProductionLog.findMany({
    where,
    orderBy: { productionDate: "desc" },
    include: {
      site: { select: { id: true, name: true } },
      catalogItem: { select: { id: true, name: true } },
    },
  });
}

export async function createProductionLog(data: MiningProductionLogInput, businessId: string, userId: string) {
  return prisma.miningProductionLog.create({
    data: {
      ...data,
      productionDate: new Date(data.productionDate),
      quantity: data.quantity,
      grade: data.grade ? data.grade : null,
      businessId,
      createdById: userId,
    },
  });
}

export async function deleteProductionLog(id: string, businessId: string) {
  return prisma.miningProductionLog.delete({ where: { id, businessId } });
}

export async function getProductionStats(businessId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayTotal, monthTotal, bySite, byMineral] = await Promise.all([
    prisma.miningProductionLog.aggregate({
      where: { businessId, productionDate: { gte: today } },
      _sum: { quantity: true },
    }),
    prisma.miningProductionLog.aggregate({
      where: { businessId, productionDate: { gte: monthStart } },
      _sum: { quantity: true },
    }),
    prisma.miningProductionLog.groupBy({
      by: ["siteId"],
      where: { businessId, productionDate: { gte: monthStart } },
      _sum: { quantity: true },
    }),
    prisma.miningProductionLog.groupBy({
      by: ["unit"],
      where: { businessId, productionDate: { gte: monthStart } },
      _sum: { quantity: true },
    }),
  ]);

  return {
    today: Number(todayTotal._sum.quantity || 0),
    thisMonth: Number(monthTotal._sum.quantity || 0),
    bySite,
    byMineral,
  };
}

export async function getProductionChartData(businessId: string, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = await prisma.miningProductionLog.findMany({
    where: { businessId, productionDate: { gte: startDate } },
    orderBy: { productionDate: "asc" },
    select: { productionDate: true, quantity: true, unit: true },
  });

  const dailyMap = new Map<string, number>();
  for (const log of logs) {
    const key = log.productionDate.toISOString().split("T")[0];
    dailyMap.set(key, (dailyMap.get(key) || 0) + Number(log.quantity));
  }

  return Array.from(dailyMap.entries()).map(([date, quantity]) => ({ date, quantity }));
}
