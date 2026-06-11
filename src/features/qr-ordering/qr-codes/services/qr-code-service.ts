import "server-only";

import { prisma } from "@/server/db";
import { randomBytes } from "crypto";
import type { ActionResponse } from "@/types/relationships";
import { QRCodeStatus } from "@/types/enums";
import type { CreateQRCodeSchema, AssignQRCodeSchema, InstallQRCodeSchema, QRCodeFilterSchema } from "../schemas";
import type { QRCodeWithRelations } from "../types";

function generateQRCode(): string {
  return randomBytes(16).toString("hex").toUpperCase();
}

export async function createQRCodes(
  data: CreateQRCodeSchema,
): Promise<ActionResponse & { data?: { count: number } }> {
  try {
    const campaign = await prisma.distributionCampaign.findUnique({
      where: { id: data.campaignId },
      select: { id: true },
    });

    if (!campaign) {
      return { success: false, message: "Campaign not found" };
    }

    const codes: Array<{ campaignId: string; code: string }> = [];

    for (let i = 0; i < data.count; i++) {
      codes.push({
        campaignId: data.campaignId,
        code: generateQRCode(),
      });
    }

    await prisma.qRCode.createMany({ data: codes });

    await prisma.distributionCampaign.update({
      where: { id: data.campaignId },
      data: { totalQRCodes: { increment: data.count } },
    });

    return {
      success: true,
      message: `${data.count} QR code(s) generated successfully`,
      data: { count: data.count },
    };
  } catch (error) {
    console.error("Create QR codes error:", error);
    return { success: false, message: "Failed to generate QR codes" };
  }
}

export async function getQRCode(id: string): Promise<QRCodeWithRelations | null> {
  return prisma.qRCode.findUnique({
    where: { id },
    include: {
      campaign: { select: { id: true, name: true } },
      business: { select: { id: true, name: true } },
      assignments: { orderBy: { assignedAt: "desc" } },
      installations: { orderBy: { installedAt: "desc" } },
    },
  }) as Promise<QRCodeWithRelations | null>;
}

export async function listQRCodes(filters?: QRCodeFilterSchema) {
  const where: Record<string, unknown> = {};

  if (filters?.campaignId) where.campaignId = filters.campaignId;
  if (filters?.status) where.status = filters.status;
  if (filters?.businessId) where.businessId = filters.businessId;
  if (filters?.assignedToId) where.assignedToId = filters.assignedToId;

  return prisma.qRCode.findMany({
    where,
    include: {
      campaign: { select: { id: true, name: true } },
      business: { select: { id: true, name: true } },
      assignments: { orderBy: { assignedAt: "desc" }, take: 1 },
      installations: { orderBy: { installedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  }) as Promise<QRCodeWithRelations[]>;
}

export async function updateQRCode(
  id: string,
  data: Partial<{ status: QRCodeStatus; businessId: string | null; assignedToId: string | null }>,
): Promise<ActionResponse> {
  try {
    await prisma.qRCode.update({ where: { id }, data });
    return { success: true, message: "QR code updated successfully" };
  } catch (error) {
    console.error("Update QR code error:", error);
    return { success: false, message: "Failed to update QR code" };
  }
}

export async function deleteQRCode(id: string): Promise<ActionResponse> {
  try {
    await prisma.qRCode.delete({ where: { id } });
    return { success: true, message: "QR code deleted successfully" };
  } catch (error) {
    console.error("Delete QR code error:", error);
    return { success: false, message: "Failed to delete QR code" };
  }
}

export async function assignQRCode(
  data: AssignQRCodeSchema,
  assignedBy: string,
): Promise<ActionResponse> {
  try {
    const qrCodes = await prisma.qRCode.findMany({
      where: {
        id: { in: data.qrCodeIds },
        status: QRCodeStatus.UNASSIGNED,
      },
    });

    if (qrCodes.length !== data.qrCodeIds.length) {
      return {
        success: false,
        message: "Some QR codes are not available for assignment",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.qRCodeAssignment.createMany({
        data: data.qrCodeIds.map((qrCodeId) => ({
          qrCodeId,
          assignedTo: data.assignedTo,
          assignedBy,
          notes: data.notes || null,
        })),
      });

      await tx.qRCode.updateMany({
        where: { id: { in: data.qrCodeIds } },
        data: {
          status: QRCodeStatus.ASSIGNED,
          assignedToId: data.assignedTo,
        },
      });
    });

    return {
      success: true,
      message: `${data.qrCodeIds.length} QR code(s) assigned successfully`,
    };
  } catch (error) {
    console.error("Assign QR code error:", error);
    return { success: false, message: "Failed to assign QR codes" };
  }
}

export async function installQRCode(
  data: InstallQRCodeSchema,
  installedBy: string,
): Promise<ActionResponse> {
  try {
    const qrCode = await prisma.qRCode.findUnique({
      where: { id: data.qrCodeId },
    });

    if (!qrCode) {
      return { success: false, message: "QR code not found" };
    }

    if (qrCode.status !== QRCodeStatus.ASSIGNED) {
      return { success: false, message: "QR code must be assigned before installation" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.qRCodeInstallation.create({
        data: {
          qrCodeId: data.qrCodeId,
          businessId: data.businessId,
          location: data.location || null,
          installedBy,
          notes: data.notes || null,
        },
      });

      await tx.qRCode.update({
        where: { id: data.qrCodeId },
        data: {
          status: QRCodeStatus.INSTALLED,
          businessId: data.businessId,
          installedAt: new Date(),
        },
      });
    });

    return { success: true, message: "QR code installed successfully" };
  } catch (error) {
    console.error("Install QR code error:", error);
    return { success: false, message: "Failed to install QR code" };
  }
}
