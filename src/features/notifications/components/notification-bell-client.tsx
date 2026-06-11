"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TYPE_LABELS, TYPE_VARIANTS } from "../constants";
import { formatDate } from "@/lib/utils";
import type { NotificationWithUser } from "../types";

interface NotificationBellClientProps {
  unreadCount: number;
  notifications: NotificationWithUser[];
}

export function NotificationBellClient({
  unreadCount,
  notifications,
}: NotificationBellClientProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-card shadow-lg z-50">
          <div className="p-3 border-b">
            <p className="text-sm font-semibold">
              Notifications
              {unreadCount > 0 && (
                <span className="text-muted-foreground font-normal ml-1">
                  ({unreadCount} unread)
                </span>
              )}
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-center text-muted-foreground">
                No new notifications
              </p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {notif.message}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={TYPE_VARIANTS[notif.type] ?? "default"}
                      className="shrink-0 text-[10px] px-1.5 py-0"
                    >
                      {TYPE_LABELS[notif.type] ?? notif.type}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDate(notif.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
