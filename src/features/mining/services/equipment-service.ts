import "server-only";
import { prisma } from "@/server/db";
import type { MiningEquipmentInput, MiningServiceLogInput } from "../schemas";
import type { Prisma } from "@prisma/client";

export async function listMiningEquipment(
  businessId: string,
  filters?: { status?: string; siteId?: string; equipmentType?: string; search?: string },
) {
  const where: Prisma.MiningEquipmentWhereInput = { businessId, isActive: true };

  if (filters?.status) where.status = filters.status as any;
  if (filters?.siteId) where.siteId = filters.siteId;
  if (filters?.equipmentType) where.equipmentType = filters.equipmentType;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { serialNumber: { contains: filters.search, mode: "insensitive" } },
      { make: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.miningEquipment.findMany({
    where,
    orderBy: { name: "asc" },
    include: { site: { select: { id: true, name: true } } },
  });
}

export async function getMiningEquipment(id: string, businessId: string) {
  return prisma.miningEquipment.findFirst({
    where: { id, businessId },
    include: {
      site: { select: { id: true, name: true } },
      serviceLogs: { orderBy: { serviceDate: "desc" }, take: 10 },
      fuelTxns: { orderBy: { transactionDate: "desc" }, take: 20 },
    },
  });
}

export async function createMiningEquipment(
  data: MiningEquipmentInput,
  businessId: string,
  userId: string,
) {
  return prisma.miningEquipment.create({
    data: {
      ...data,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      lastMaintenance: data.lastMaintenance ? new Date(data.lastMaintenance) : null,
      nextMaintenance: data.nextMaintenance ? new Date(data.nextMaintenance) : null,
      purchasePrice: data.purchasePrice ? data.purchasePrice : null,
      fuelCapacity: data.fuelCapacity ? data.fuelCapacity : null,
      hourlyFuelUsage: data.hourlyFuelUsage ? data.hourlyFuelUsage : null,
      meterReading: data.meterReading ? data.meterReading : 0,
      businessId,
      createdById: userId,
    },
  });
}

export async function updateMiningEquipment(
  id: string,
  data: Partial<MiningEquipmentInput>,
  businessId: string,
) {
  const updateData: any = { ...data };
  if (data.purchaseDate) updateData.purchaseDate = new Date(data.purchaseDate);
  if (data.lastMaintenance) updateData.lastMaintenance = new Date(data.lastMaintenance);
  if (data.nextMaintenance) updateData.nextMaintenance = new Date(data.nextMaintenance);

  return prisma.miningEquipment.update({ where: { id, businessId }, data: updateData });
}

export async function deleteMiningEquipment(id: string, businessId: string) {
  return prisma.miningEquipment.update({
    where: { id, businessId },
    data: { isActive: false },
  });
}

export async function getEquipmentStats(businessId: string) {
  const [total, operational, maintenance, repair] = await Promise.all([
    prisma.miningEquipment.count({ where: { businessId, isActive: true } }),
    prisma.miningEquipment.count({ where: { businessId, isActive: true, status: "OPERATIONAL" } }),
    prisma.miningEquipment.count({ where: { businessId, isActive: true, status: "MAINTENANCE" } }),
    prisma.miningEquipment.count({ where: { businessId, isActive: true, status: "REPAIR" } }),
  ]);
  return { total, operational, maintenance, repair };
}

export async function createServiceLog(data: MiningServiceLogInput, businessId: string, userId: string) {
  const log = await prisma.miningServiceLog.create({
    data: {
      ...data,
      serviceDate: new Date(data.serviceDate),
      nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : null,
      cost: data.cost ? data.cost : null,
      businessId,
      createdById: userId,
    },
  });

  await prisma.miningEquipment.update({
    where: { id: data.equipmentId, businessId },
    data: {
      lastMaintenance: new Date(data.serviceDate),
      nextMaintenance: data.nextServiceDate ? new Date(data.nextServiceDate) : null,
      meterReading: data.meterAtService ?? undefined,
    },
  });

  return log;
}

export async function listServiceLogs(equipmentId: string, businessId: string) {
  return prisma.miningServiceLog.findMany({
    where: { equipment: { id: equipmentId, businessId } },
    orderBy: { serviceDate: "desc" },
  });
}

export async function getDueForService(businessId: string) {
  const now = new Date();
  return prisma.miningEquipment.findMany({
    where: {
      businessId,
      isActive: true,
      status: "OPERATIONAL",
      nextMaintenance: { lte: now },
    },
    orderBy: { nextMaintenance: "asc" },
    include: { site: { select: { id: true, name: true } } },
  });
}
