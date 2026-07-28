import "server-only";
import { prisma } from "@/server/db";
import type { MiningSiteInput } from "../schemas";
import type { Prisma } from "@prisma/client";

export async function listMiningSites(
  businessId: string,
  filters?: { status?: string; mineralType?: string; search?: string },
) {
  const where: Prisma.MiningSiteWhereInput = { businessId };

  if (filters?.status) where.status = filters.status as any;
  if (filters?.mineralType) where.mineralType = filters.mineralType;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { location: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.miningSite.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { equipment: true, licenses: true } },
    },
  });
}

export async function getMiningSite(id: string, businessId: string) {
  return prisma.miningSite.findFirst({
    where: { id, businessId },
    include: {
      licenses: { orderBy: { issueDate: "desc" } },
      equipment: { where: { isActive: true }, orderBy: { name: "asc" } },
      _count: { select: { fuelTxns: true, productionLogs: true } },
    },
  });
}

export async function createMiningSite(data: MiningSiteInput, businessId: string, userId: string) {
  return prisma.miningSite.create({
    data: {
      ...data,
      size: data.size ? data.size : undefined,
      businessId,
      createdById: userId,
    },
  });
}

export async function updateMiningSite(id: string, data: Partial<MiningSiteInput>, businessId: string) {
  return prisma.miningSite.update({
    where: { id, businessId },
    data: {
      ...data,
      size: data.size ? data.size : undefined,
    },
  });
}

export async function deleteMiningSite(id: string, businessId: string) {
  return prisma.miningSite.delete({ where: { id, businessId } });
}

export async function getMiningSiteStats(businessId: string) {
  const [total, active, onHold, depleted] = await Promise.all([
    prisma.miningSite.count({ where: { businessId } }),
    prisma.miningSite.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.miningSite.count({ where: { businessId, status: "ON_HOLD" } }),
    prisma.miningSite.count({ where: { businessId, status: "DEPLETED" } }),
  ]);
  return { total, active, onHold, depleted };
}
