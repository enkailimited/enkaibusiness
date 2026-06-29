import "server-only";

import { prisma } from "@/server/db";
import { headers } from "next/headers";

export async function createAuditLog(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  data?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const h = await headers();
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        before: data?.before ?? {},
        after: data?.after ?? {},
        ipAddress: h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? null,
        userAgent: h.get("user-agent") ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
