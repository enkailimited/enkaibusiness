import "server-only";
import { prisma } from "@/server/db";
import type { FuelTransactionInput } from "../schemas";
import type { Prisma } from "@prisma/client";

export async function listFuelTransactions(
  businessId: string,
  filters?: {
    fuelType?: string;
    siteId?: string;
    equipmentId?: string;
    startDate?: string;
    endDate?: string;
  },
) {
  const where: Prisma.FuelTransactionWhereInput = { businessId };

  if (filters?.fuelType) where.fuelType = filters.fuelType as any;
  if (filters?.siteId) where.siteId = filters.siteId;
  if (filters?.equipmentId) where.equipmentId = filters.equipmentId;
  if (filters?.startDate || filters?.endDate) {
    where.transactionDate = {};
    if (filters.startDate) where.transactionDate.gte = new Date(filters.startDate);
    if (filters.endDate) where.transactionDate.lte = new Date(filters.endDate);
  }

  return prisma.fuelTransaction.findMany({
    where,
    orderBy: { transactionDate: "desc" },
    include: {
      site: { select: { id: true, name: true } },
      equipment: { select: { id: true, name: true } },
    },
  });
}

export async function getFuelTransaction(id: string, businessId: string) {
  return prisma.fuelTransaction.findFirst({
    where: { id, businessId },
    include: {
      site: { select: { id: true, name: true } },
      equipment: { select: { id: true, name: true } },
    },
  });
}

export async function createFuelTransaction(data: FuelTransactionInput, businessId: string, userId: string) {
  const totalCost = data.totalCost ?? (data.unitCost && data.quantity ? data.unitCost * data.quantity : null);

  return prisma.fuelTransaction.create({
    data: {
      ...data,
      transactionDate: new Date(data.transactionDate),
      unitCost: data.unitCost ? data.unitCost : null,
      totalCost: totalCost ? totalCost : null,
      businessId,
      createdById: userId,
    },
  });
}

export async function deleteFuelTransaction(id: string, businessId: string) {
  return prisma.fuelTransaction.delete({ where: { id, businessId } });
}

export async function getFuelStats(businessId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalLiters, totalCost, byType] = await Promise.all([
    prisma.fuelTransaction.aggregate({
      where: { businessId, transactionDate: { gte: thirtyDaysAgo } },
      _sum: { quantity: true },
    }),
    prisma.fuelTransaction.aggregate({
      where: { businessId, transactionDate: { gte: thirtyDaysAgo } },
      _sum: { totalCost: true },
    }),
    prisma.fuelTransaction.groupBy({
      by: ["fuelType"],
      where: { businessId, transactionDate: { gte: thirtyDaysAgo } },
      _sum: { quantity: true, totalCost: true },
    }),
  ]);

  return {
    totalLiters: Number(totalLiters._sum.quantity || 0),
    totalCost: Number(totalCost._sum.totalCost || 0),
    byType: byType.map((t) => ({
      fuelType: t.fuelType,
      quantity: Number(t._sum.quantity || 0),
      cost: Number(t._sum.totalCost || 0),
    })),
  };
}
