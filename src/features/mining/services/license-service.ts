import "server-only";
import { prisma } from "@/server/db";
import type { MiningLicenseInput } from "../schemas";
import type { Prisma } from "@prisma/client";

export async function listMiningLicenses(
  businessId: string,
  filters?: { status?: string; siteId?: string; search?: string },
) {
  const where: Prisma.MiningLicenseWhereInput = { businessId };

  if (filters?.status) where.status = filters.status as any;
  if (filters?.siteId) where.siteId = filters.siteId;
  if (filters?.search) {
    where.OR = [
      { licenseNumber: { contains: filters.search, mode: "insensitive" } },
      { type: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.miningLicense.findMany({
    where,
    orderBy: { issueDate: "desc" },
    include: { site: { select: { id: true, name: true } } },
  });
}

export async function getMiningLicense(id: string, businessId: string) {
  return prisma.miningLicense.findFirst({
    where: { id, businessId },
    include: { site: { select: { id: true, name: true } } },
  });
}

export async function createMiningLicense(
  data: MiningLicenseInput,
  businessId: string,
  userId: string,
) {
  return prisma.miningLicense.create({
    data: {
      ...data,
      issueDate: new Date(data.issueDate),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      businessId,
      createdById: userId,
    },
  });
}

export async function updateMiningLicense(
  id: string,
  data: Partial<MiningLicenseInput>,
  businessId: string,
) {
  const updateData: any = { ...data };
  if (data.issueDate) updateData.issueDate = new Date(data.issueDate);
  if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate);
  else if (data.expiryDate === null) updateData.expiryDate = null;

  return prisma.miningLicense.update({ where: { id, businessId }, data: updateData });
}

export async function deleteMiningLicense(id: string, businessId: string) {
  return prisma.miningLicense.delete({ where: { id, businessId } });
}

export async function getLicenseStats(businessId: string) {
  const [total, active, expired, pending] = await Promise.all([
    prisma.miningLicense.count({ where: { businessId } }),
    prisma.miningLicense.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.miningLicense.count({ where: { businessId, status: "EXPIRED" } }),
    prisma.miningLicense.count({ where: { businessId, status: "PENDING" } }),
  ]);
  return { total, active, expired, pending };
}

export async function getExpiringLicenses(businessId: string, days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  return prisma.miningLicense.findMany({
    where: { businessId, status: "ACTIVE", expiryDate: { lte: cutoff } },
    orderBy: { expiryDate: "asc" },
    include: { site: { select: { id: true, name: true } } },
  });
}
