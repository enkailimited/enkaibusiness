import { requireAuth } from "@/server/auth";
import { getUnreadCount, getNotifications } from "../services/notification-service";
import { NotificationBellClient } from "./notification-bell-client";

interface NotificationBellProps {
  limit?: number;
}

export async function NotificationBell({ limit = 5 }: NotificationBellProps) {
  const user = await requireAuth();

  const [unreadCount, { data: recent }] = await Promise.all([
    getUnreadCount(user.id),
    getNotifications(user.id, { isRead: false, page: 1, limit }),
  ]);

  return (
    <NotificationBellClient
      unreadCount={unreadCount}
      notifications={recent}
    />
  );
}
