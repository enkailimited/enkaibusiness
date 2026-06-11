import type { Notification, User } from "@/types/models";

export type NotificationType = "alert" | "info" | "warning" | "success";

export interface NotificationWithUser extends Notification {
  user: Pick<User, "id" | "firstName" | "lastName" | "email" | "avatarUrl">;
}

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message?: string;
  type: NotificationType;
  referenceType?: string;
  referenceId?: string;
}

export interface NotificationFilter {
  type?: NotificationType;
  isRead?: boolean;
  fromDate?: string;
  toDate?: string;
}
