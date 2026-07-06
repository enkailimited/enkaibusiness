"use client";

import { useState, useEffect } from "react";
import {
  getUnreadCountAction,
  getNotificationsAction,
} from "../actions";
import { NotificationBellClient } from "./notification-bell-client";

export function NotificationBell() {
  const [initialData, setInitialData] = useState<{
    unreadCount: number;
    notifications: any[];
  } | null>(null);

  useEffect(() => {
    Promise.all([
      getUnreadCountAction(),
      getNotificationsAction({ isRead: false, page: 1, limit: 10 }),
    ]).then(([count, res]) => {
      setInitialData({
        unreadCount: count,
        notifications: res.data ?? [],
      });
    });
  }, []);

  if (!initialData) {
    return <div className="h-9 w-9" />;
  }

  return (
    <NotificationBellClient
      initialUnreadCount={initialData.unreadCount}
      initialNotifications={initialData.notifications}
    />
  );
}
