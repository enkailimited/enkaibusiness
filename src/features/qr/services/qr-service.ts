import "server-only";
import { prisma } from "@/server/db";
import type { QRMode } from "../constants";
export { QR_MODES_BY_INDUSTRY } from "../constants";

function generateQRCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createQRExperience(data: {
  businessId: string; branchId?: string; label?: string;
  mode: QRMode; destinationUrl?: string;
}) {
  let code = generateQRCode();
  let exists = await prisma.qRExperience.findUnique({ where: { code } });
  while (exists) {
    code = generateQRCode();
    exists = await prisma.qRExperience.findUnique({ where: { code } });
  }

  return prisma.qRExperience.create({
    data: {
      businessId: data.businessId,
      branchId: data.branchId || null,
      code,
      label: data.label || null,
      mode: data.mode as any,
      status: "PENDING_INSTALLATION",
      destinationUrl: data.destinationUrl || null,
    },
    include: {
      business: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function getQRExperiences(businessId?: string) {
  const where: Record<string, unknown> = {};
  if (businessId) where.businessId = businessId;

  return prisma.qRExperience.findMany({
    where,
    select: {
      id: true, code: true, label: true, mode: true, status: true,
      scanCount: true, lastScannedAt: true, activatedAt: true,
      createdAt: true,
      business: { select: { id: true, name: true, slug: true } },
      branch: { select: { id: true, name: true } },
      installation: { select: { id: true, installedAt: true, location: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getQRExperienceById(id: string) {
  return prisma.qRExperience.findUnique({
    where: { id },
    include: {
      business: { select: { id: true, name: true, slug: true, currency: true } },
      branch: { select: { id: true, name: true } },
      installation: true,
    },
  });
}

export async function getQRExperienceByCode(code: string) {
  return prisma.qRExperience.findUnique({
    where: { code },
    include: {
      business: {
        select: {
          id: true, name: true, slug: true, currency: true,
          metadata: true,
        },
      },
      branch: { select: { id: true, name: true, address: true } },
    },
  });
}

export async function recordQRScan(experienceId: string) {
  return prisma.qRExperience.update({
    where: { id: experienceId },
    data: {
      scanCount: { increment: 1 },
      lastScannedAt: new Date(),
    },
  });
}

export async function updateQRStatus(id: string, status: string) {
  const updateData: Record<string, unknown> = { status };
  if (status === "ACTIVE") updateData.activatedAt = new Date();
  return prisma.qRExperience.update({ where: { id }, data: updateData });
}

export async function recordQRInstallation(data: {
  experienceId: string; installedBy: string;
  location?: string; material?: string; size?: string; orientation?: string; notes?: string;
}) {
  await prisma.qRExperienceInstallation.create({
    data: {
      experienceId: data.experienceId,
      installedBy: data.installedBy,
      location: data.location || null,
      material: data.material || "vinyl",
      size: data.size || "8cm x 8cm",
      orientation: data.orientation || "portrait",
      notes: data.notes || null,
    },
  });
  return updateQRStatus(data.experienceId, "ACTIVE");
}

export function getModeLabel(mode: string): string {
  const parts = mode.split("_");
  return parts.slice(1).join(" ");
}

export function getIndustryForMode(mode: string): string {
  if (mode.startsWith("COMMERCE")) return "COMMERCE";
  if (mode.startsWith("RESTAURANT")) return "RESTAURANT";
  if (mode.startsWith("HEALTHCARE")) return "HEALTHCARE";
  if (mode.startsWith("EDUCATION")) return "EDUCATION";
  if (mode.startsWith("HOTEL")) return "HOTEL";
  if (mode.startsWith("MANUFACTURING")) return "MANUFACTURING";
  if (mode.startsWith("AGRICULTURE")) return "AGRICULTURE";
  if (mode.startsWith("REAL_ESTATE")) return "REAL_ESTATE";
  if (mode.startsWith("SERVICES")) return "SERVICES";
  if (mode.startsWith("LOGISTICS")) return "LOGISTICS";
  if (mode.startsWith("NON_PROFIT")) return "NON_PROFIT";
  return "COMMERCE";
}
