import "server-only";

import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";
import type { ActionResponse, PaginatedResponse } from "@/types/relationships";
import type { CreateActivitySchema, ActivityFilterSchema } from "../schemas";
import type { ActivityWithUser } from "../types";

export async function recordActivity(
  data: CreateActivitySchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const activity = await prisma.activity.create({
      data: {
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });

    return {
      success: true,
      message: "Activity recorded",
      data: { id: activity.id },
    };
  } catch (error) {
    console.error("Record activity error:", error);
    return { success: false, message: "Failed to record activity" };
  }
}

export async function getActivities(
  filter?: ActivityFilterSchema,
): Promise<PaginatedResponse<ActivityWithUser>> {
  const where: Record<string, unknown> = {};

  if (filter?.userId) {
    where.userId = filter.userId;
  }

  if (filter?.action) {
    where.action = filter.action;
  }

  if (filter?.resourceType) {
    where.resourceType = filter.resourceType;
  }

  if (filter?.resourceId) {
    where.resourceId = filter.resourceId;
  }

  if (filter?.fromDate || filter?.toDate) {
    const createdAt: Record<string, Date> = {};
    if (filter?.fromDate) createdAt.gte = new Date(filter.fromDate);
    if (filter?.toDate) createdAt.lte = new Date(filter.toDate);
    where.createdAt = createdAt;
  }

  const page = filter?.page ?? 1;
  const limit = filter?.limit ?? 20;

  const [raw, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activity.count({ where }),
  ]);

  return {
    data: raw as unknown as ActivityWithUser[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getRecentActivities(
  limit = 10,
): Promise<ActivityWithUser[]> {
  const raw = await prisma.activity.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return raw as unknown as ActivityWithUser[];
}

export async function deleteOldActivities(
  beforeDate: Date,
): Promise<ActionResponse> {
  try {
    await prisma.activity.deleteMany({
      where: { createdAt: { lt: beforeDate } },
    });

    return { success: true, message: "Old activities deleted" };
  } catch (error) {
    console.error("Delete old activities error:", error);
    return { success: false, message: "Failed to delete old activities" };
  }
}
