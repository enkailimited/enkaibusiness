"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFirdausContext } from "../provider/firdaus-context";
import { usePathname } from "next/navigation";

export function FirdausGlobalListener() {
  const { state, actions } = useFirdausContext();
  const pathname = usePathname();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimer = useRef<NodeJS.Timeout | null>(null);
  const [businessScanned, setBusinessScanned] = useState(false);

  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startRecognition = useCallback(() => {
    if (!isSupported || recognitionRef.current) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "sw-TZ,en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.trim().toLowerCase();

      if (transcript.includes("firdaus")) {
        const command = transcript.replace(/firdaus\s*/i, "").trim();
        if (command) {
          actions.sendMessage(command);
        } else {
          actions.wake();
          actions.speak("Ndio, nakusikiliza. Nikusaidie nini?");
        }
      }
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      restartTimer.current = setTimeout(startRecognition, 2000);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      restartTimer.current = setTimeout(startRecognition, 500);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, actions]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
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
    startRecognition();
    return () => stopRecognition();
  }, [isSupported, startRecognition, stopRecognition]);

  // Auto-sleep after 2 minutes of inactivity
  useEffect(() => {
    if (!state.isAwake) return;
    const timer = setTimeout(() => {
      actions.sleep();
    }, 120000);
    return () => clearTimeout(timer);
  }, [state.isAwake, state.messages.length, actions]);

  // Update context when path changes (detect business/entity)
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const businessIdx = segments.indexOf("businesses");
    if (businessIdx !== -1 && segments[businessIdx + 1]) {
      const businessId = segments[businessIdx + 1];
      actions.setBusinessContext({ businessId });

      // Scan business once per session when business ID is first resolved
      if (!businessScanned && typeof window !== "undefined") {
        setBusinessScanned(true);
      }
    }
  }, [pathname, actions, businessScanned]);

  return null;
}
