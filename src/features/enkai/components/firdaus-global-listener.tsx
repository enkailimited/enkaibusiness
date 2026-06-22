"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFirdausContext } from "../provider/firdaus-context";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  detectWakeWord,
  HIGH_CONFIDENCE,
  MEDIUM_CONFIDENCE,
  COOLDOWN_MS,
} from "../utils/wake-word";

export function FirdausGlobalListener() {
  const { state, actions } = useFirdausContext();
  const { user } = useAuth();
  const pathname = usePathname();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimer = useRef<NodeJS.Timeout | null>(null);
  const [businessScanned, setBusinessScanned] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const mountedRef = useRef(true);

  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const lastTriggerTimeRef = useRef(0);

  const startRecognition = useCallback(() => {
    if (!isSupported || recognitionRef.current || permissionDenied) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "sw";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Collect best wake word match across all results and alternatives
      let bestMatch: { command: string; confidence: number } | null = null;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result || !result.isFinal) continue;

        for (let j = 0; j < result.length; j++) {
          const alternative = result[j];
          if (!alternative) continue;
          const transcript = alternative.transcript.trim().toLowerCase();

          if (transcript) {
            console.log("[Firdaus] Heard:", transcript);
          }

          const wakeResult = detectWakeWord(transcript);
          if (wakeResult.detected && wakeResult.confidence > (bestMatch?.confidence || 0)) {
            bestMatch = { command: wakeResult.command, confidence: wakeResult.confidence };
          }
        }
      }

      if (!bestMatch) return;

      // Cooldown: ignore if triggered too recently
      const now = Date.now();
      if (now - lastTriggerTimeRef.current < COOLDOWN_MS) return;
      lastTriggerTimeRef.current = now;

      const a = actionsRef.current;

      if (bestMatch.confidence >= HIGH_CONFIDENCE) {
        console.log("[Firdaus] Wake (high:", bestMatch.confidence.toFixed(2), "):", bestMatch.command || "(no command)");
        if (bestMatch.command) {
          a.sendMessage(bestMatch.command);
        } else {
          a.wake();
          a.speak("Ndio, nakusikiliza. Nikusaidie nini?");
        }
      } else if (bestMatch.confidence >= MEDIUM_CONFIDENCE) {
        console.log("[Firdaus] Wake (medium:", bestMatch.confidence.toFixed(2), "):", bestMatch.command || "(no command)");
        a.wake();
        a.speak("Ulisema Dausi?");
      } else {
        console.log("[Firdaus] Wake (low:", bestMatch.confidence.toFixed(2), ") — ignored");
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") return;
      recognitionRef.current = null;

      if (event.error === "not-allowed") {
        setPermissionDenied(true);
        return;
      }

      restartTimer.current = setTimeout(() => {
        if (mountedRef.current) startRecognition();
      }, 300);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (permissionDenied || !mountedRef.current) return;
      restartTimer.current = setTimeout(() => {
        if (mountedRef.current) startRecognition();
      }, 300);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.warn("[Firdaus] Failed to start recognition:", err);
      recognitionRef.current = null;
    }
  }, [isSupported, permissionDenied]);

  const stopRecognition = useCallback(() => {
    mountedRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    if (restartTimer.current) {
      clearTimeout(restartTimer.current);
      restartTimer.current = null;
    }
  }, []);

  // Start recognition on mount, stop on unmount
  useEffect(() => {
    if (!isSupported) return;
    mountedRef.current = true;
    startRecognition();
    return () => stopRecognition();
  }, [isSupported, startRecognition, stopRecognition]);

  // Auto-sleep after 2 minutes of inactivity
  useEffect(() => {
    if (!state.isAwake) return;
    const timer = setTimeout(() => {
      actionsRef.current.sleep();
    }, 120000);
    return () => clearTimeout(timer);
  }, [state.isAwake, state.messages.length]);

  // Detect mode + sub-page from pathname
  const modeRef = useRef<"platform" | "workspace" | "generic">("generic");
  const subPageRef = useRef<string>("");
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const mode = segments[0] === "platform" ? "platform" as const
      : segments[0] === "workspaces" ? "workspace" as const
      : "generic" as const;
    if (mode !== modeRef.current) {
      modeRef.current = mode;
    }
    const subPage = segments[1] || "";
    if (subPage !== subPageRef.current) {
      subPageRef.current = subPage;
    }
  }, [pathname]);

  // Set user context from auth session (works everywhere — platform + workspace)
  const contextKeyRef = useRef<string>("");
  useEffect(() => {
    if (!user?.id) return;
    const key = `${user.id}|${user.currentBusinessId || ""}|${modeRef.current}`;
    if (key === contextKeyRef.current) return;
    contextKeyRef.current = key;
    actions.setBusinessContext({
      userId: user.id,
      businessId: user.currentBusinessId || undefined,
      mode: modeRef.current,
    });
  });

  // Detect business ID from /workspaces/businesses/[id] path
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const businessIdx = segments.indexOf("businesses");
    if (businessIdx >= 1 && segments[businessIdx - 1] === "workspaces" && segments[businessIdx + 1]) {
      const businessId = segments[businessIdx + 1];

      actions.setBusinessContext({
        businessId: businessId as string,
        userId: user?.id,
        mode: "workspace",
      });

      if (!businessScanned) {
        setBusinessScanned(true);
      }
    }
  }, [pathname, businessScanned, user?.id]);

  if (!mounted) return null;

  if (!isSupported) {
    return (
      <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 text-xs text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
          Firdaus voice unavailable in this browser
        </div>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
        <button
          type="button"
          onClick={() => setPermissionDenied(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 hover:bg-amber-500/20 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Firdaus imezima sauti. Bonyeza kuruhusu mikrofoni
        </button>
      </div>
    );
  }

  const modeLabel = modeRef.current === "platform" ? "Platform"
    : modeRef.current === "workspace" ? "Workspace"
    : "";

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 text-xs text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {modeLabel && <span className="font-medium text-[10px] uppercase tracking-wider opacity-70">{modeLabel}</span>}
        Firdaus anakusikiliza...
      </div>
    </div>
  );
}
