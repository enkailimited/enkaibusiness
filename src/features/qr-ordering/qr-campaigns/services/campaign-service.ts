import "server-only";

import { prisma } from "@/server/db";
import { slugify } from "@/lib/utils";
import { CampaignStatus } from "@/types/enums";
import type { ActionResponse } from "@/types/relationships";
import type { CreateCampaignSchema, UpdateCampaignSchema, CampaignFilterSchema } from "../schemas";
import type { CampaignWithCount, CampaignWithQRCodes } from "../types";

export async function createCampaign(
  data: CreateCampaignSchema,
  createdById: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const slug = slugify(data.name);
    const slugBase = slug;
    let finalSlug = slug;
    let counter = 1;

    while (await prisma.distributionCampaign.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slugBase}-${counter}`;
      counter++;
    }

    const campaign = await prisma.distributionCampaign.create({
      data: {
        name: data.name,
        slug: finalSlug,
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

export async function getCampaign(id: string): Promise<CampaignWithQRCodes | null> {
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
      _count: { select: { qrCodes: true } },
    },
  }) as Promise<CampaignWithQRCodes | null>;
}

export async function listCampaigns(filters?: CampaignFilterSchema) {
  const where: Record<string, unknown> = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { slug: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.fromDate) {
    where.createdAt = { ...(where.createdAt as Record<string, unknown> || {}), gte: new Date(filters.fromDate) };
  }
  if (filters?.toDate) {
    where.createdAt = { ...(where.createdAt as Record<string, unknown> || {}), lte: new Date(filters.toDate) };
  }

  return prisma.distributionCampaign.findMany({
    where,
    include: {
      _count: { select: { qrCodes: true } },
    },
    orderBy: { createdAt: "desc" },
  }) as Promise<CampaignWithCount[]>;
}

export async function updateCampaign(
  id: string,
  data: UpdateCampaignSchema,
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
      const slug = slugify(data.name);
      const slugBase = slug;
      let finalSlug = slug;
      let counter = 1;

      const existing = await prisma.distributionCampaign.findUnique({ where: { id } });
      if (existing && existing.slug !== finalSlug) {
        while (await prisma.distributionCampaign.findFirst({
          where: { slug: finalSlug, id: { not: id } },
        })) {
          finalSlug = `${slugBase}-${counter}`;
          counter++;
        }
      }

      updateData.slug = finalSlug;
    }
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

export async function deleteCampaign(id: string): Promise<ActionResponse> {
  try {
    await prisma.distributionCampaign.delete({ where: { id } });
    return { success: true, message: "Campaign deleted successfully" };
  } catch (error) {
    console.error("Delete campaign error:", error);
    return { success: false, message: "Failed to delete campaign" };
  }
}

export async function launchCampaign(id: string): Promise<ActionResponse> {
  try {
    const campaign = await prisma.distributionCampaign.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!campaign) return { success: false, message: "Campaign not found" };
    if (campaign.status !== CampaignStatus.DRAFT) {
      return { success: false, message: "Only draft campaigns can be launched" };
    }

    await prisma.distributionCampaign.update({
      where: { id },
      data: {
        status: CampaignStatus.ACTIVE,
        startDate: new Date(),
      },
    });

    return { success: true, message: "Campaign launched successfully" };
  } catch (error) {
    console.error("Launch campaign error:", error);
    return { success: false, message: "Failed to launch campaign" };
  }
}

export async function completeCampaign(id: string): Promise<ActionResponse> {
  try {
    const campaign = await prisma.distributionCampaign.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!campaign) return { success: false, message: "Campaign not found" };
    if (campaign.status !== CampaignStatus.ACTIVE) {
      return { success: false, message: "Only active campaigns can be completed" };
    }

    await prisma.distributionCampaign.update({
      where: { id },
      data: {
        status: CampaignStatus.COMPLETED,
        endDate: new Date(),
      },
    });

    return { success: true, message: "Campaign completed successfully" };
  } catch (error) {
    console.error("Complete campaign error:", error);
    return { success: false, message: "Failed to complete campaign" };
  }
}

export async function cancelCampaign(id: string): Promise<ActionResponse> {
  try {
    const campaign = await prisma.distributionCampaign.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!campaign) return { success: false, message: "Campaign not found" };
    if (campaign.status === CampaignStatus.COMPLETED || campaign.status === CampaignStatus.ARCHIVED) {
      return { success: false, message: "Cannot cancel a completed or archived campaign" };
    }

    await prisma.distributionCampaign.update({
      where: { id },
      data: { status: CampaignStatus.ARCHIVED },
    });

    return { success: true, message: "Campaign cancelled successfully" };
  } catch (error) {
    console.error("Cancel campaign error:", error);
    return { success: false, message: "Failed to cancel campaign" };
  }
}

export async function getCampaignMetrics() {
  const [total, active, draft, completed, archived, totalQRCodes, installed, assigned, unassigned] =
    await Promise.all([
      prisma.distributionCampaign.count(),
      prisma.distributionCampaign.count({ where: { status: CampaignStatus.ACTIVE } }),
      prisma.distributionCampaign.count({ where: { status: CampaignStatus.DRAFT } }),
      prisma.distributionCampaign.count({ where: { status: CampaignStatus.COMPLETED } }),
      prisma.distributionCampaign.count({ where: { status: CampaignStatus.ARCHIVED } }),
      prisma.qRCode.count(),
      prisma.qRCode.count({ where: { status: "INSTALLED" } }),
      prisma.qRCode.count({ where: { status: "ASSIGNED" } }),
      prisma.qRCode.count({ where: { status: "UNASSIGNED" } }),
    ]);

  return { total, active, draft, completed, archived, totalQRCodes, installed, assigned, unassigned };
}
