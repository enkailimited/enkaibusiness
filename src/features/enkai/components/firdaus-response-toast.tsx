"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useFirdausContext } from "../provider/firdaus-context";

const PUBLIC_ROUTES = new Set([
  "/login", "/register", "/forgot-password", "/reset-password",
  "/landing", "/marketing",
]);

export function FirdausResponseToast() {
  const pathname = usePathname();
  if (PUBLIC_ROUTES.has(pathname) || pathname.startsWith("/public/")) return null;
  const { state } = useFirdausContext();
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const lastMsg = state.messages[state.messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;
    if (lastMsg.content === content) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    setContent(lastMsg.content);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 10000);
  }, [state.messages, content]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full px-4 animate-in slide-in-from-bottom-4 fade-in duration-500 md:bottom-20">
      <div className="rounded-xl border bg-background shadow-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg shrink-0 mt-0.5 text-primary">✦ Firdaus</span>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
