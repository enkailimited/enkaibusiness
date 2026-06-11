import "server-only";

import { prisma } from "@/server/db";
import { randomBytes } from "crypto";
import type { ActionResponse } from "@/types/relationships";
import type {
  CreateCampaignSchema,
  UpdateCampaignSchema,
  AssignQRCodeSchema,
  InstallQRCodeSchema,
} from "@/lib/validations/distribution";

function generateQRCode(): string {
  return randomBytes(16).toString("hex").toUpperCase();
}

export async function createCampaign(
  data: CreateCampaignSchema,
  createdById: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const campaign = await prisma.distributionCampaign.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        totalQRCodes: data.totalQRCodes || 0,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        createdById,
      },
    });

    return {
      success: true,
      message: "Campaign created successfully",
      data: { id: campaign.id },
    };
  } catch (error) {
    console.error("Create campaign error:", error);
    return { success: false, message: "Failed to create campaign" };
  }
}

export async function getCampaigns() {
  return prisma.distributionCampaign.findMany({
    include: {
      _count: { select: { qrCodes: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCampaign(id: string) {
  return prisma.distributionCampaign.findUnique({
    where: { id },
    include: {
      qrCodes: {
        include: {
          business: { select: { id: true, name: true } },
          assignments: { orderBy: { assignedAt: "desc" }, take: 1 },
          installations: { orderBy: { installedAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      },
      createdBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });
}

export async function updateCampaign(
  id: string,
  data: UpdateCampaignSchema & { status?: string },
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.totalQRCodes !== undefined) updateData.totalQRCodes = data.totalQRCodes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

    await prisma.distributionCampaign.update({
      where: { id },
      data: updateData,
    });

    return { success: true, message: "Campaign updated successfully" };
  } catch (error) {
    console.error("Update campaign error:", error);
    return { success: false, message: "Failed to update campaign" };
  }
}

export async function generateQRCodes(
  campaignId: string,
  count: number,
): Promise<ActionResponse & { data?: { count: number } }> {
  try {
    const codes: Array<{ campaignId: string; code: string }> = [];

    for (let i = 0; i < count; i++) {
      codes.push({
        campaignId,
        code: generateQRCode(),
      });
    }

    await prisma.qRCode.createMany({ data: codes });

    await prisma.distributionCampaign.update({
      where: { id: campaignId },
      data: { totalQRCodes: { increment: count } },
    });

    return {
      success: true,
      message: `${count} QR codes generated successfully`,
      data: { count },
    };
  } catch (error) {
    console.error("Generate QR codes error:", error);
    return { success: false, message: "Failed to generate QR codes" };
  }
}

export async function assignQRCodes(
  data: AssignQRCodeSchema,
  assignedBy: string,
): Promise<ActionResponse> {
  try {
    const qrCodes = await prisma.qRCode.findMany({
      where: {
        id: { in: data.qrCodeIds },
        status: "UNASSIGNED",
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
          status: "ASSIGNED",
          assignedToId: data.assignedTo,
        },
      });
    });

    return {
      success: true,
      message: `${data.qrCodeIds.length} QR codes assigned successfully`,
    };
  } catch (error) {
    console.error("Assign QR codes error:", error);
    return { success: false, message: "Failed to assign QR codes" };
  }
}

export async function getQRCodes(filters?: {
  campaignId?: string;
  status?: string;
  businessId?: string;
  assignedToId?: string;
}) {
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
  });
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
          status: "INSTALLED",
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

export async function getDistributionMetrics() {
  const [installed, active, inactive, unassigned, assigned, damaged, totalCampaigns] =
    await Promise.all([
      prisma.qRCode.count({ where: { status: "INSTALLED" } }),
      prisma.qRCode.count({ where: { status: "ACTIVE" } }),
      prisma.qRCode.count({ where: { status: "INACTIVE" } }),
      prisma.qRCode.count({ where: { status: "UNASSIGNED" } }),
      prisma.qRCode.count({ where: { status: "ASSIGNED" } }),
      prisma.qRCode.count({ where: { status: "DAMAGED" } }),
      prisma.distributionCampaign.count(),
    ]);

  return {
    installed,
    active,
    inactive,
    unassigned,
    assigned,
    damaged,
    totalQRCodes: installed + active + inactive + unassigned + assigned + damaged,
    totalCampaigns,
  };
}
