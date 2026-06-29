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
import { VoiceState, voiceStateMachine } from "../voice/voice-state-machine";

interface AudioResult {
  transcript: string;
  confidence: number;
}

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
  const stateRef = useRef(state);
  stateRef.current = state;

  const lastWakeTimeRef = useRef(0);
  const isSpeakingRef = useRef(false);

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

  const startRecognition = useCallback(() => {
    if (!isSupported || recognitionRef.current || permissionDenied) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "sw";
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

      if (!isMicrophoneAudio(finalTranscript)) {
        console.log("[Firdaus] Skipping non-microphone audio:", finalTranscript);
        return;
      }

      const now = Date.now();

      if (voiceStateMachine.state === VoiceState.SLEEPING) {
        if (now - lastWakeTimeRef.current < COOLDOWN_MS) return;

        const wakeResult = detectWakeWord(finalTranscript);
        console.log(
          `[Firdaus] Wake check: "${finalTranscript}" confidence=${wakeResult.confidence.toFixed(2)} detected=${wakeResult.detected}`
        );

        if (wakeResult.detected && wakeResult.confidence >= HIGH_CONFIDENCE) {
          lastWakeTimeRef.current = now;

          console.log("[Firdaus] Wake detected (high):", wakeResult);

          voiceStateMachine.transition({
            from: VoiceState.SLEEPING,
            to: VoiceState.WAKE_DETECTED,
            reason: "wake_word_detected",
          });
          actionsRef.current.updateVoiceState(VoiceState.WAKE_DETECTED);

          const cleanedCommand = removeWakeWord(finalTranscript, wakeResult.wakeWord);
          console.log("[Firdaus] Wake word removed:", cleanedCommand);

          actionsRef.current.wake();

          if (cleanedCommand) {
            const analysis = analyzeVoiceIntent(cleanedCommand);
            console.log(formatPipelineLog(analysis));

            if (analysis.intent !== "UNKNOWN" && analysis.confidence >= 0.5) {
              voiceStateMachine.transition({
                from: VoiceState.WAKE_DETECTED,
                to: VoiceState.UNDERSTANDING,
                reason: "speech_detected",
              });
              actionsRef.current.updateVoiceState(VoiceState.UNDERSTANDING);
              actionsRef.current.sendMessage(cleanedCommand);
            } else {
              actionsRef.current.speak("Ndio, nakusikiliza. Nikusaidie nini?");
            }
          } else {
            actionsRef.current.speak("Ndio, nakusikiliza. Nikusaidie nini?");
          }
          return;
        }

        if (wakeResult.detected && wakeResult.confidence >= MEDIUM_CONFIDENCE && wakeResult.confidence < HIGH_CONFIDENCE) {
          lastWakeTimeRef.current = now;
          console.log("[Firdaus] Wake detected (medium):", wakeResult);
          voiceStateMachine.transition({
            from: VoiceState.SLEEPING,
            to: VoiceState.WAKE_DETECTED,
            reason: "wake_word_detected",
          });
          actionsRef.current.wake();
          actionsRef.current.speak("Ulisema Firdausi?");
          return;
        }
        return;
      }

      if (voiceStateMachine.isAwake) {
        const wakeResult = detectWakeWord(finalTranscript);
        if (wakeResult.detected && wakeResult.confidence >= HIGH_CONFIDENCE) {
          const cleanedCommand = removeWakeWord(finalTranscript, wakeResult.wakeWord);
          if (cleanedCommand) {
            const analysis = analyzeVoiceIntent(cleanedCommand);
            console.log(formatPipelineLog(analysis));
            if (analysis.intent !== "UNKNOWN" && analysis.confidence >= 0.5) {
              if (voiceStateMachine.state !== VoiceState.UNDERSTANDING && voiceStateMachine.state !== VoiceState.EXECUTING) {
                voiceStateMachine.transition({
                  from: voiceStateMachine.state as any,
                  to: VoiceState.UNDERSTANDING,
                  reason: "speech_detected",
                });
              }
              actionsRef.current.updateVoiceState(VoiceState.UNDERSTANDING);
              actionsRef.current.sendMessage(cleanedCommand);
              return;
            }
          }
        }

        if (voiceStateMachine.isListening) {
          const analysis = analyzeVoiceIntent(finalTranscript);
          console.log(formatPipelineLog(analysis));

          if (analysis.intent !== "UNKNOWN" && analysis.confidence >= 0.5) {
            const fromState = voiceStateMachine.state === VoiceState.WAKE_DETECTED
              ? VoiceState.WAKE_DETECTED
              : VoiceState.LISTENING;
            voiceStateMachine.transition({
              from: fromState,
              to: VoiceState.UNDERSTANDING,
              reason: "speech_detected",
            });
            actionsRef.current.sendMessage(finalTranscript);
          }
        }
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
      }, 1000);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (permissionDenied || !mountedRef.current) return;
      restartTimer.current = setTimeout(() => {
        if (mountedRef.current && !isSpeakingRef.current) startRecognition();
      }, 500);
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

  useEffect(() => {
    if (!isSupported) return;
    mountedRef.current = true;
    startRecognition();

    const handleVoiceStart = () => {
      isSpeakingRef.current = true;
      const current = voiceStateMachine.state;
      if (current === VoiceState.UNDERSTANDING) {
        voiceStateMachine.transition({
          from: VoiceState.UNDERSTANDING,
          to: VoiceState.RESPONDING,
          reason: "action_complete",
        });
      } else if (current === VoiceState.EXECUTING) {
        voiceStateMachine.transition({
          from: VoiceState.EXECUTING,
          to: VoiceState.RESPONDING,
          reason: "action_complete",
        });
      } else if (current === VoiceState.LISTENING || current === VoiceState.WAKE_DETECTED) {
        voiceStateMachine.transition({
          from: current,
          to: VoiceState.RESPONDING,
          reason: "action_complete",
        } as any);
      }
      actionsRef.current.updateVoiceState(VoiceState.RESPONDING);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
    };

    const handleVoiceEnd = () => {
      isSpeakingRef.current = false;
      const hasActiveWorkflow = stateRef.current.currentWorkflow;
      if (hasActiveWorkflow) {
        voiceStateMachine.transition({
          from: VoiceState.RESPONDING,
          to: VoiceState.LISTENING,
          reason: "follow_up_needed",
        });
        actionsRef.current.updateVoiceState(VoiceState.LISTENING);
      } else {
        voiceStateMachine.transition({
          from: VoiceState.RESPONDING,
          to: VoiceState.SLEEPING,
          reason: "response_complete",
        });
        actionsRef.current.sleep();
      }
      if (mountedRef.current) {
        setTimeout(() => startRecognition(), 300);
      }
    };

    window.addEventListener("firdaus:voice-start", handleVoiceStart);
    window.addEventListener("firdaus:voice-end", handleVoiceEnd);

    return () => {
      stopRecognition();
      window.removeEventListener("firdaus:voice-start", handleVoiceStart);
      window.removeEventListener("firdaus:voice-end", handleVoiceEnd);
    };
  }, [isSupported, startRecognition, stopRecognition]);

  useEffect(() => {
    if (!state.isAwake) return;
    const timer = setTimeout(() => {
      actionsRef.current.sleep();
    }, 30000);
    return () => clearTimeout(timer);
  }, [state.isAwake, state.messages.length, state.currentWorkflow]);

  const modeRef = useRef<"platform" | "workspace" | "generic">("generic");
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const mode = segments[0] === "platform" ? "platform" as const
      : segments[0] === "workspaces" ? "workspace" as const
      : "generic" as const;
    modeRef.current = mode;
  }, [pathname]);

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

  const stateLabel = state.voiceState === VoiceState.SLEEPING ? "amelala"
    : state.voiceState === VoiceState.WAKE_DETECTED ? "ameamka"
    : state.voiceState === VoiceState.LISTENING ? "anasikiliza"
    : state.voiceState === VoiceState.UNDERSTANDING ? "anaelewa"
    : state.voiceState === VoiceState.EXECUTING ? "anafanya"
    : state.voiceState === VoiceState.RESPONDING ? "anazungumza"
    : "";

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 text-xs text-muted-foreground">
        <span className={`w-1.5 h-1.5 rounded-full ${state.voiceState === VoiceState.SLEEPING ? "bg-muted-foreground/50" : "bg-emerald-500"} ${state.voiceState !== VoiceState.SLEEPING ? "animate-pulse" : ""}`} />
        {modeLabel && <span className="font-medium text-[10px] uppercase tracking-wider opacity-70">{modeLabel}</span>}
        Firdaus {stateLabel}
      </div>
    </div>
  );
}
