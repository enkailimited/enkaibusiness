"use client";

import { useEffect, useRef, useCallback } from "react";

interface SSEOptions {
  businessId: string;
  userId: string;
  onEvent: (event: string, data: unknown) => void;
  onConnected?: () => void;
  onError?: (error: Event) => void;
}

export function useSSE({ businessId, userId, onEvent, onConnected, onError }: SSEOptions): () => void {
  const eventSourceRef = useRef<EventSource | null>(null);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    const url = `/api/events?businessId=${encodeURIComponent(businessId)}&userId=${encodeURIComponent(userId)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("connected", () => onConnected?.());
    es.addEventListener("heartbeat", () => {});

    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        onEvent(msg.type || "message", data);
      } catch {
        onEvent(msg.type || "message", msg.data);
      }
    };

    es.onerror = (err) => {
      onError?.(err);
      es.close();
    };

    return () => es.close();
  }, [businessId, userId, onEvent, onConnected, onError]);

  return disconnect;
}
