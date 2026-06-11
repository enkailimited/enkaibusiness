import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse, PaginatedResponse } from "@/types/relationships";
import type { CreateNotificationSchema, NotificationFilterSchema } from "../schemas";
import type { NotificationWithUser } from "../types";

export async function createNotification(
  data: CreateNotificationSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message || null,
        type: data.type,
        referenceType: data.referenceType || null,
        referenceId: data.referenceId || null,
      },
    });

    return {
      success: true,
      message: "Notification created successfully",
      data: { id: notification.id },
    };
  } catch (error) {
    console.error("Create notification error:", error);
    return { success: false, message: "Failed to create notification" };
  }
}

export async function createBulkNotifications(
  userIds: string[],
  data: Omit<CreateNotificationSchema, "userId">,
): Promise<ActionResponse> {
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title: data.title,
        message: data.message || null,
        type: data.type,
        referenceType: data.referenceType || null,
        referenceId: data.referenceId || null,
      })),
    });

    return {
      success: true,
      message: `Notifications sent to ${userIds.length} users`,
    };
  } catch (error) {
    console.error("Bulk create notification error:", error);
    return { success: false, message: "Failed to send notifications" };
  }
}

export async function getNotifications(
  userId: string,
  filter?: NotificationFilterSchema,
): Promise<PaginatedResponse<NotificationWithUser>> {
  const where: Record<string, unknown> = { userId };

  if (filter?.type) {
    where.type = filter.type;
  }

  if (filter?.isRead !== undefined) {
    where.isRead = filter.isRead;
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
    prisma.notification.findMany({
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
    prisma.notification.count({ where }),
  ]);

  return {
    data: raw as unknown as NotificationWithUser[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function markAsRead(
  notificationId: string,
  userId: string,
): Promise<ActionResponse> {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return { success: false, message: "Notification not found" };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true, message: "Notification marked as read" };
  } catch (error) {
    console.error("Mark as read error:", error);
    return { success: false, message: "Failed to mark notification as read" };
  }
}

export async function markAllAsRead(userId: string): Promise<ActionResponse> {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true, message: "All notifications marked as read" };
  } catch (error) {
    console.error("Mark all as read error:", error);
    return { success: false, message: "Failed to mark notifications as read" };
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  } catch {
    return 0;
  }
}

export async function deleteNotification(
  id: string,
  userId: string,
): Promise<ActionResponse> {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return { success: false, message: "Notification not found" };
    }

    await prisma.notification.delete({ where: { id } });

    return { success: true, message: "Notification deleted" };
  } catch (error) {
    console.error("Delete notification error:", error);
    return { success: false, message: "Failed to delete notification" };
  }
}
