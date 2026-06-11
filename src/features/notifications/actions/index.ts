"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createNotification,
  createBulkNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} from "../services/notification-service";
import {
  createNotificationSchema,
  notificationFilterSchema,
} from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createNotificationAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createNotificationSchema.safeParse({
    userId: formData.get("userId"),
    title: formData.get("title"),
    message: formData.get("message") || undefined,
    type: formData.get("type") || undefined,
    referenceType: formData.get("referenceType") || undefined,
    referenceId: formData.get("referenceId") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createNotification(parsed.data);

  if (result.success) {
    revalidatePath("/notifications");
  }

  return result;
}

export async function getNotificationsAction(
  filter?: Record<string, unknown>,
) {
  const user = await requireAuth();

  const parsed = filter
    ? notificationFilterSchema.safeParse(filter)
    : { success: true, data: undefined };

  if (!parsed.success) {
    return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  return getNotifications(user.id, parsed.data);
}

export async function markAsReadAction(
  notificationId: string,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const result = await markAsRead(notificationId, user.id);

  if (result.success) {
    revalidatePath("/notifications");
  }

  return result;
}

export async function markAllAsReadAction(): Promise<ActionResponse> {
  const user = await requireAuth();
  const result = await markAllAsRead(user.id);

  if (result.success) {
    revalidatePath("/notifications");
  }

  return result;
}

export async function getUnreadCountAction(): Promise<number> {
  const user = await requireAuth();
  return getUnreadCount(user.id);
}

export async function deleteNotificationAction(
  id: string,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const result = await deleteNotification(id, user.id);

  if (result.success) {
    revalidatePath("/notifications");
  }

  return result;
}

export async function createBulkNotificationsAction(
  userIds: string[],
  data: { title: string; message?: string; type: string; referenceType?: string; referenceId?: string },
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createNotificationSchema
    .omit({ userId: true })
    .safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  return createBulkNotifications(userIds, parsed.data);
}
