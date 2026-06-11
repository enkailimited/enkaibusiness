import "server-only";

import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";
import type { ActionResponse, PaginatedResponse } from "@/types/relationships";
import type { AuditLogFilterSchema } from "../schemas";
import type { AuditLogWithUser } from "../types";

export async function recordAuditLog(data: {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const log = await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        before: (data.before ?? {}) as Prisma.InputJsonValue,
        after: (data.after ?? {}) as Prisma.InputJsonValue,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });

    return {
      success: true,
      message: "Audit log recorded",
      data: { id: log.id },
    };
  } catch (error) {
    console.error("Record audit log error:", error);
    return { success: false, message: "Failed to record audit log" };
  }
}

export async function getAuditLogs(
  filter?: AuditLogFilterSchema,
): Promise<PaginatedResponse<AuditLogWithUser>> {
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
    prisma.auditLog.findMany({
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
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: raw as unknown as AuditLogWithUser[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAuditTrail(
  resourceType: string,
  resourceId: string,
  filter?: Omit<AuditLogFilterSchema, "resourceType" | "resourceId">,
): Promise<PaginatedResponse<AuditLogWithUser>> {
  return getAuditLogs({
    ...filter,
    resourceType,
    resourceId,
  });
}
