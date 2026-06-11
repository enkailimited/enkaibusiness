"use server";

import { requireAuth } from "@/server/auth";
import {
  recordActivity,
  getActivities,
  getRecentActivities,
} from "../services/activity-service";
import {
  createActivitySchema,
  activityFilterSchema,
} from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function recordActivityAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createActivitySchema.safeParse({
    userId: formData.get("userId"),
    action: formData.get("action"),
    resourceType: formData.get("resourceType"),
    resourceId: formData.get("resourceId"),
    metadata: formData.get("metadata") ? JSON.parse(formData.get("metadata") as string) : undefined,
    ipAddress: formData.get("ipAddress") || undefined,
    userAgent: formData.get("userAgent") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  return recordActivity(parsed.data);
}

export async function getActivitiesAction(
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter
    ? activityFilterSchema.safeParse(filter)
    : { success: true, data: undefined };

  if (!parsed.success) {
    return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  return getActivities(parsed.data);
}

export async function getRecentActivitiesAction(limit?: number) {
  await requireAuth();
  return getRecentActivities(limit);
}

export async function recordActivityRaw(
  data: {
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<ActionResponse & { data?: { id: string } }> {
  await requireAuth();

  const parsed = createActivitySchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  return recordActivity(parsed.data);
}
