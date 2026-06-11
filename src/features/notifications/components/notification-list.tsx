import { requireAuth } from "@/server/auth";
import { getNotifications } from "../services/notification-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { TYPE_LABELS, TYPE_VARIANTS } from "../constants";
import { formatDate } from "@/lib/utils";
import type { NotificationWithUser } from "../types";

interface NotificationListProps {
  type?: string;
  isRead?: boolean;
  page?: number;
}

export async function NotificationList({
  type,
  isRead,
  page = 1,
}: NotificationListProps) {
  const user = await requireAuth();

  const { data: notifications } = await getNotifications(user.id, {
    type: type as "alert" | "info" | "warning" | "success" | undefined,
    isRead,
    page,
    limit: 20,
  });

  const columns = [
    {
      key: "title",
      header: "Title",
      cell: (notif: NotificationWithUser) => (
        <div className="flex items-center gap-2">
          <span className={notif.isRead ? "" : "font-semibold"}>{notif.title}</span>
          {!notif.isRead && (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
        </div>
      ),
    },
    {
      key: "message",
      header: "Message",
      cell: (notif: NotificationWithUser) => (
        <span className="text-sm text-muted-foreground truncate max-w-xs block">
          {notif.message ?? "-"}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (notif: NotificationWithUser) => (
        <Badge variant={TYPE_VARIANTS[notif.type] ?? "default"}>
          {TYPE_LABELS[notif.type] ?? notif.type}
        </Badge>
      ),
    },
    {
      key: "isRead",
      header: "Status",
      cell: (notif: NotificationWithUser) => (
        <Badge variant={notif.isRead ? "secondary" : "default"}>
          {notif.isRead ? "Read" : "Unread"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (notif: NotificationWithUser) => (
        <span className="text-sm text-muted-foreground">{formatDate(notif.createdAt)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={notifications}
      emptyTitle="No notifications"
      emptyDescription="You have no notifications yet."
    />
  );
}
