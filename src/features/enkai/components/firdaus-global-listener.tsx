"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFirdausContext } from "../provider/firdaus-context";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  detectWakeWord,
  removeWakeWord,
  HIGH_CONFIDENCE,
  MEDIUM_CONFIDENCE,
  COOLDOWN_MS,
} from "../utils/wake-word";
import { analyzeVoiceIntent, formatPipelineLog } from "../voice/voice-intent";
import type { VoiceIntentResult } from "../voice/voice-intent";
import { VoiceState, getStatusLabel, getVoiceStateMachine, isStandby } from "../voice/voice-state-machine";

const PUBLIC_ROUTES = new Set([
  "/login", "/register", "/forgot-password", "/reset-password",
  "/landing", "/marketing",
]);

const AUTH_ROUTE_PREFIXES = [
  "/workspaces", "/workspace", "/dashboard", "/business",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (pathname.startsWith("/public/")) return true;
  return false;
}

function isAuthenticatedRoute(pathname: string): boolean {
  return AUTH_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

let instanceCount = 0;

export function FirdausGlobalListener() {
  const { state, actions } = useFirdausContext();
  const { user } = useAuth();
  const pathname = usePathname();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimer = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const stateRef = useRef(state);
  stateRef.current = state;
  const lastWakeTimeRef = useRef(0);
  const isSpeakingRef = useRef(false);
  const restartAttemptsRef = useRef(0);
  const intentionalStopRef = useRef(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const instanceId = useRef(++instanceCount);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    if (instanceId.current > 1) {
      console.warn(`[Firdaus] Singleton violation — killing instance ${instanceId.current}`);
      return;
    }
    setMounted(true);
    return () => { instanceCount = 0; };
  }, []);

  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const shouldRender = mounted && isSupported && !isPublicRoute(pathname);

  const NOISE_TRANSCRIPTS = new Set([
    "subscribe", "like", "share", "comment", "play", "pause",
    "unmute", "mute", "skip ad", "skip", "next", "previous",
    "click", "open", "close", "loading",
  ]);

  function isLikelyNoise(transcript: string): boolean {
    const t = transcript.toLowerCase().trim();
    if (NOISE_TRANSCRIPTS.has(t)) return true;
    if (/^\d+%$/.test(t)) return true;
    if (/^you(tube|r)?/.test(t)) return true;
    if (/^instagram/.test(t)) return true;
    if (/^whatsapp/.test(t)) return true;
    if (t.length < 2) return true;
    return false;
  }

  function isMicrophoneAudio(transcript: string): boolean {
    const lower = transcript.toLowerCase().trim();
    if (isLikelyNoise(lower)) return false;
    if (/^\d{1,3}$/.test(lower) && !lower.includes("shilingi") && !lower.includes("tsh") && !lower.includes("kilo")) {
      return false;
    }
    return true;
  }

  async function ensureMicrophonePermission(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return true;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      setPermissionDenied(true);
      return false;
    }
  }

  const vsm = getVoiceStateMachine(user?.id || "anon");

  const startRecognition = useCallback(async () => {
    if (!isSupported || recognitionRef.current || permissionDenied) return;
    if (isPublicRoute(pathname)) return;
    if (!user?.id) return;

    const granted = await ensureMicrophonePermission();
    if (!granted) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    const supportedLangs = ["sw", "sw-TZ", "en-US", "en"];
    recognition.lang = supportedLangs.find((l) => {
      try {
        const test = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        test.lang = l;
        return true;
      } catch {
        return false;
      }
    }) || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (isSpeakingRef.current) return;

      let finalTranscript = "";
      let bestConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result || !result.isFinal) continue;

        for (let j = 0; j < result.length; j++) {
          const alternative = result[j];
          if (!alternative) continue;
          const transcript = alternative.transcript.trim().toLowerCase();
          if (!transcript) continue;

          if (alternative.confidence > bestConfidence) {
            bestConfidence = alternative.confidence;
            finalTranscript = transcript;
          }
        }
      }

      if (!finalTranscript) return;

      restartAttemptsRef.current = 0;

      if (!isMicrophoneAudio(finalTranscript)) return;

      const now = Date.now();
      const vs = vsm.state;

      if (isStandby(vs) || vs === VoiceState.SLEEPING) {
        if (now - lastWakeTimeRef.current < COOLDOWN_MS) return;

        const wakeResult = detectWakeWord(finalTranscript);

        if (wakeResult.detected && wakeResult.confidence >= HIGH_CONFIDENCE) {
          lastWakeTimeRef.current = now;
          vsm.transition({ from: vs, to: VoiceState.WAKE_DETECTED, reason: "wake_word_detected" });
          actionsRef.current.updateVoiceState(VoiceState.WAKE_DETECTED);
          actionsRef.current.wake();

          const cleanedCommand = removeWakeWord(finalTranscript, wakeResult.wakeWord);

          if (cleanedCommand) {
            const analysis = analyzeVoiceIntent(cleanedCommand);
            if (analysis.intent !== "UNKNOWN" && analysis.confidence >= 0.5) {
              actionsRef.current.updateVoiceState(VoiceState.UNDERSTANDING);
              actionsRef.current.sendMessage(cleanedCommand);
              return;
            }
          }

          actionsRef.current.speak("Ndio, nakusikiliza. Nikusaidie nini?");
          return;
        }

        if (wakeResult.detected && wakeResult.confidence >= MEDIUM_CONFIDENCE && wakeResult.confidence < HIGH_CONFIDENCE) {
          lastWakeTimeRef.current = now;
          actionsRef.current.wake();
          actionsRef.current.speak("Ulisema Firdausi?");
          return;
        }
        return;
      }

      if (vsm.isAwake) {
        const wakeResult = detectWakeWord(finalTranscript);
        if (wakeResult.detected && wakeResult.confidence >= HIGH_CONFIDENCE) {
          const cleanedCommand = removeWakeWord(finalTranscript, wakeResult.wakeWord);
          if (cleanedCommand) {
            const analysis = analyzeVoiceIntent(cleanedCommand);
            if (analysis.intent !== "UNKNOWN" && analysis.confidence >= 0.5) {
              actionsRef.current.updateVoiceState(VoiceState.UNDERSTANDING);
              actionsRef.current.sendMessage(cleanedCommand);
              return;
            }
          }
        }

        if (vsm.isListening) {
          const analysis = analyzeVoiceIntent(finalTranscript);
          if (analysis.intent !== "UNKNOWN" && analysis.confidence >= 0.5) {
            actionsRef.current.sendMessage(finalTranscript);
          }
        }
      }
    };

    recognition.onaudiostart = () => {
      isListeningRef.current = true;
    };
    recognition.onaudioend = () => {
      isListeningRef.current = false;
    };
    recognition.onspeechstart = () => {
      window.dispatchEvent(new CustomEvent("firdaus:speech-start"));
    };
    recognition.onspeechend = () => {
      window.dispatchEvent(new CustomEvent("firdaus:speech-end"));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") return;
      recognitionRef.current = null;

      if (event.error === "not-allowed") {
        setPermissionDenied(true);
        actionsRef.current.updateVoiceState(VoiceState.DISCONNECTED);
        clearInactivityTimer();
        return;
      }

      actionsRef.current.updateVoiceState(VoiceState.ERROR);
      scheduleRestart();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (permissionDenied || !mountedRef.current) return;
      if (isPublicRoute(pathname)) return;
      if (intentionalStopRef.current) {
        intentionalStopRef.current = false;
        return;
      }
      scheduleRestart();
    };

    recognitionRef.current = recognition;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });
      audioStreamRef.current = stream;
      recognition.start();
      if (vsm.state === VoiceState.INITIALIZING) {
        vsm.transition({ from: VoiceState.INITIALIZING, to: VoiceState.READY, reason: "initialized" });
      }
    } catch (err) {
      console.warn("[Firdaus] Failed to start recognition:", err);
      recognitionRef.current = null;
    }
  }, [isSupported, permissionDenied, pathname, user?.id, vsm]);

  const stopRecognition = useCallback(() => {
    if (restartTimer.current) {
      clearTimeout(restartTimer.current);
      restartTimer.current = null;
    }
    if (recognitionRef.current) {
      intentionalStopRef.current = true;
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    clearInactivityTimer();
  }, []);

  function scheduleRestart() {
    if (restartTimer.current) clearTimeout(restartTimer.current);
    if (!mountedRef.current) return;
    const delay = Math.min(1000 * Math.pow(2, restartAttemptsRef.current), 30000);
    restartAttemptsRef.current += 1;
    restartTimer.current = setTimeout(() => {
      if (mountedRef.current && !isPublicRoute(pathname) && user?.id && !permissionDenied) {
        if (vsm.state === VoiceState.ERROR) {
          vsm.transition({ from: VoiceState.ERROR, to: VoiceState.INITIALIZING, reason: "recover" });
        }
        startRecognition();
      }
    }, delay);
  }

  function clearInactivityTimer() {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  }

  useEffect(() => {
    if (!mountedRef.current) return;
    if (instanceId.current > 1) return;

    if (isPublicRoute(pathname)) {
      stopRecognition();
      return;
    }

    if (!user?.id) return;

    if (vsm.state === VoiceState.BOOTING) {
      vsm.transition({ from: VoiceState.BOOTING, to: VoiceState.INITIALIZING, reason: "start_init" });
    }

    startRecognition();

    const handleVoiceStart = () => {
      isSpeakingRef.current = true;
      actionsRef.current.updateVoiceState(VoiceState.RESPONDING);
      stopRecognition();
    };

    const handleVoiceEnd = () => {
      isSpeakingRef.current = false;
      const hasActiveWorkflow = stateRef.current.currentWorkflow;

      if (hasActiveWorkflow) {
        actionsRef.current.updateVoiceState(VoiceState.LISTENING);
      } else {
        actionsRef.current.updateVoiceState(VoiceState.READY);
      }

      if (mountedRef.current) {
        restartAttemptsRef.current = 0;
        setTimeout(() => startRecognition(), 300);
      }
    };

    window.addEventListener("firdaus:voice-start", handleVoiceStart);
    window.addEventListener("firdaus:voice-end", handleVoiceEnd);

    return () => {
      stopRecognition();
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      }
      window.removeEventListener("firdaus:voice-start", handleVoiceStart);
      window.removeEventListener("firdaus:voice-end", handleVoiceEnd);
    };
  }, [pathname, user?.id, isSupported, startRecognition, stopRecognition, vsm]);

  useEffect(() => {
    if (!state.isAwake || state.currentWorkflow) return;

    clearInactivityTimer();
    inactivityTimer.current = setTimeout(() => {
      actionsRef.current.sleep();
      actionsRef.current.updateVoiceState(VoiceState.READY);
    }, 30000);

    return clearInactivityTimer;
  }, [state.isAwake, state.currentWorkflow]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch {}
          recognitionRef.current = null;
        }
      } else {
        if (user?.id && !permissionDenied) {
          ensureMicrophonePermission().then((granted) => {
            if (granted) startRecognition();
          });
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user?.id, permissionDenied, startRecognition]);

  if (!mounted) return null;
  if (!isSupported) return null;
  if (isPublicRoute(pathname)) return null;

  const statusMsg = state.statusMessage || getStatusLabel(state.voiceState);

  if (permissionDenied) {
    return (
      <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
        <button
          type="button"
          onClick={() => {
            setPermissionDenied(false);
            actions.updateVoiceState(VoiceState.READY);
            startRecognition();
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 hover:bg-amber-500/20 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Microphone blocked. Click to allow
        </button>
      </div>
    );
  }

  const isSleeping = state.voiceState === VoiceState.SLEEPING;
  const isOnline = state.voiceState !== VoiceState.DISCONNECTED
    && state.voiceState !== VoiceState.ERROR;

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 text-xs text-muted-foreground">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isSleeping ? "bg-muted-foreground/50" : isOnline ? "bg-emerald-500" : "bg-red-500"
          } ${!isSleeping && isOnline ? "animate-pulse" : ""}`}
        />
        Firdaus {statusMsg.toLowerCase()}
      </div>
    </div>
  );
}
