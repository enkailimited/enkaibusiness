"use server";

import { requireAuth } from "@/server/auth";
import {
  recordAuditLog,
  getAuditLogs,
  getAuditTrail,
} from "../services/audit-service";
import { auditLogFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function getAuditLogsAction(
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter
    ? auditLogFilterSchema.safeParse(filter)
    : { success: true, data: undefined };

  if (!parsed.success) {
    return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  return getAuditLogs(parsed.data);
}

export async function getAuditTrailAction(
  resourceType: string,
  resourceId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter
    ? auditLogFilterSchema
        .omit({ resourceType: true, resourceId: true })
        .safeParse(filter)
    : { success: true, data: undefined };

  if (!parsed.success) {
    return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  return getAuditTrail(resourceType, resourceId, parsed.data);
}

export async function recordAuditLogRaw(
  data: {
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<ActionResponse & { data?: { id: string } }> {
  await requireAuth();
  return recordAuditLog(data);
}
