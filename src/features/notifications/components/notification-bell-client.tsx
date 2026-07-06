"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, Volume2, VibrateIcon, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TYPE_LABELS, TYPE_VARIANTS } from "../constants";
import { formatDate } from "@/lib/utils";
import type { NotificationWithUser } from "../types";
import {
  getNotificationsAction,
  getUnreadCountAction,
  markAsReadAction,
  markAllAsReadAction,
} from "../actions";
import Link from "next/link";

interface NotificationBellClientProps {
  initialUnreadCount: number;
  initialNotifications: NotificationWithUser[];
}

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio not supported
  }
}

function vibrate() {
  try {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  } catch {
    // Vibration not supported
  }
}

export function NotificationBellClient({
  initialUnreadCount,
  initialNotifications,
}: NotificationBellClientProps) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState(initialNotifications);
  const prevUnread = useRef(initialUnreadCount);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [count, res] = await Promise.all([
        getUnreadCountAction(),
        getNotificationsAction({ isRead: false, page: 1, limit: 10 }),
      ]);
      if (count > prevUnread.current) {
        playNotificationSound();
        vibrate();
      }
      prevUnread.current = count;
      setUnreadCount(count);
      setNotifications(res.data ?? []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkAllRead() {
    await markAllAsReadAction();
    setUnreadCount(0);
    setNotifications([]);
  }

  async function handleMarkRead(id: string) {
    await markAsReadAction(id);
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

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
          <div className="flex items-center justify-between p-3 border-b">
            <p className="text-sm font-semibold">
              Notifications
              {unreadCount > 0 && (
                <span className="text-muted-foreground font-normal ml-1">
                  ({unreadCount} unread)
                </span>
              )}
            </p>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </Button>
              )}
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" title="Sound on" />
              <VibrateIcon className="h-3.5 w-3.5 text-muted-foreground" title="Vibration on" />
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-center text-muted-foreground">
                No new notifications
              </p>
            ) : (
              notifications.map((notif) => {
                const content = (
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
                );

                return (
                  <div
                    key={notif.id}
                    className="group p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    {notif.link ? (
                      <Link href={notif.link} onClick={() => handleMarkRead(notif.id)}>
                        {content}
                      </Link>
                    ) : (
                      <button
                        className="w-full text-left"
                        onClick={() => handleMarkRead(notif.id)}
                      >
                        {content}
                      </button>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDate(notif.createdAt)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
