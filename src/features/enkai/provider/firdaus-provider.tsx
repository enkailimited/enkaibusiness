"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FirdausContext, type FirdausState, DEFAULT_CONVERSATION_CONTEXT } from "./firdaus-context";
import { sendVoiceMessageAction } from "../actions/service-actions";
import { VoiceState } from "../voice/voice-state-machine";

const VOICE_SAFE_ERRORS = [
  "Samahani, kuna tatizo la muda mfupi lakini naendelea kukusikiliza.",
  "Pole, sikuweza kukamilisha ombi lako. Tafadhali jaribu tena.",
  "Samahani, kuna hitilafu. Jaribu tena baadaye.",
  "Samahani, siwezi kufanya hilo kwa sasa. Jaribu tena.",
] as const;

function getRandomSafeError(): string {
  return VOICE_SAFE_ERRORS[Math.floor(Math.random() * VOICE_SAFE_ERRORS.length)]!;
}

import type { AssistantMessage, AssistantContext, FirdausMode } from "../assistant/types";
import type { FirdausActions } from "./firdaus-context";

const initialState: FirdausState = {
  isListening: false,
  isSpeaking: false,
  isAwake: false,
  voiceState: VoiceState.SLEEPING,
  messages: [],
  currentWorkflow: null,
  currentStep: null,
  collectedParams: {},
  conversationContext: { ...DEFAULT_CONVERSATION_CONTEXT },
  businessId: null,
  userId: null,
  staffId: null,
  hasGreeted: false,
  mode: "generic",
};

export function FirdausProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FirdausState>(initialState);
  const assistantContext = useRef<AssistantContext>({ userId: "" });

  const wake = useCallback(() => {
    setState((prev) => {
      if (prev.isAwake) return prev;
      return {
        ...prev,
        isAwake: true,
        voiceState: VoiceState.WAKE_DETECTED,
        messages: prev.messages.length === 0
          ? [{
              id: `firdaus_wake_${Date.now()}`,
              role: "assistant",
              content: "Ndio, nakusikiliza. Nikusaidie nini?",
              timestamp: new Date(),
            }]
          : [...prev.messages, {
              id: `firdaus_wake_${Date.now()}`,
              role: "assistant",
              content: "Ndio, nakusikiliza. Nikusaidie nini?",
              timestamp: new Date(),
            }],
      };
    });
  }, []);

  const sleep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAwake: false,
      voiceState: VoiceState.SLEEPING,
    }));
  }, []);

  const setBusinessContext = useCallback((ctx: Partial<AssistantContext>) => {
    assistantContext.current = { ...assistantContext.current, ...ctx };
    setState((prev) => ({
      ...prev,
      businessId: ctx.businessId || prev.businessId,
      userId: ctx.userId || prev.userId,
      staffId: ctx.staffId || prev.staffId,
      mode: (ctx.mode as FirdausMode) || prev.mode,
    }));
  }, []);

  const updateConversationContext = useCallback((partial: Partial<typeof DEFAULT_CONVERSATION_CONTEXT>) => {
    setState((prev) => ({
      ...prev,
      conversationContext: { ...prev.conversationContext, ...partial },
    }));
  }, []);

  const resetConversationContext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      conversationContext: { ...DEFAULT_CONVERSATION_CONTEXT },
    }));
  }, []);

  const updateVoiceState = useCallback((vs: VoiceState) => {
    setState((prev) => ({ ...prev, voiceState: vs }));
  }, []);

  const updateWorkflow = useCallback((wf: string | null, step: string | null) => {
    setState((prev) => ({ ...prev, currentWorkflow: wf, currentStep: step }));
  }, []);

  const sendingRef = useRef(false);

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const voicesLoadedRef = useRef(false);

  useEffect(() => {
    if (!("speechSynthesis" in window) || voicesLoadedRef.current) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      voicesRef.current = voices;
      voicesLoadedRef.current = true;
    } else {
      const handler = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
        voicesLoadedRef.current = true;
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
      };
      window.speechSynthesis.addEventListener("voiceschanged", handler);
      return () => window.speechSynthesis.removeEventListener("voiceschanged", handler);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const voices = voicesRef.current;
    const best = voices.find((v) => v.lang.startsWith("sw") && v.name.includes("Google"))
      || voices.find((v) => v.lang.startsWith("sw"))
      || voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google"))
      || voices.find((v) => v.lang.startsWith("en-US"))
      || voices[0];

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = best?.lang || "en-US";
    utterance.rate = 0.8;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    if (best) utterance.voice = best;
    utterance.onstart = () => {
      setState((prev) => ({ ...prev, isSpeaking: true }));
      window.dispatchEvent(new CustomEvent("firdaus:voice-start"));
    };
    utterance.onend = () => {
      setState((prev) => ({ ...prev, isSpeaking: false }));
      window.dispatchEvent(new CustomEvent("firdaus:voice-end"));
    };
    utterance.onerror = (e) => {
      console.warn("[Firdaus] SpeechSynthesis error:", e);
      setState((prev) => ({ ...prev, isSpeaking: false }));
      window.dispatchEvent(new CustomEvent("firdaus:voice-end"));
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sendingRef.current) return;
    sendingRef.current = true;

    const userMsg: AssistantMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setState((prev) => ({ ...prev, messages: [...prev.messages, userMsg], voiceState: VoiceState.UNDERSTANDING }));

    const waitId = `wait_${Date.now()}`;
    setState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: waitId,
          role: "assistant",
          content: "Subiri kidogo, ninafanyia kazi...",
          timestamp: new Date(),
        },
      ],
    }));

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 20000)
      );

      setState((prev) => ({ ...prev, voiceState: VoiceState.EXECUTING }));

      const response = await Promise.race([
        sendVoiceMessageAction(text, assistantContext.current),
        timeoutPromise,
      ]);

      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages.filter((m) => m.id !== waitId),
          {
            id: `asst_${Date.now()}`,
            role: "assistant",
            content: response.message,
            timestamp: new Date(),
          },
        ],
        currentWorkflow: response.actionData?.currentWorkflow as string || prev.currentWorkflow,
        currentStep: response.actionData?.currentStep as string || prev.currentStep,
        collectedParams: response.actionData?.collectedParams as Record<string, unknown> || prev.collectedParams,
      }));

      speak(response.message);
    } catch (err) {
      console.error("[Firdaus] sendMessage error:", err);
      const errMsg = getRandomSafeError();
      setState((prev) => ({
        ...prev,
        voiceState: VoiceState.SLEEPING,
        messages: [
          ...prev.messages.filter((m) => m.id !== waitId),
          {
            id: `err_${Date.now()}`,
            role: "assistant",
            content: errMsg,
            timestamp: new Date(),
          },
        ],
      }));
      speak(errMsg);
    } finally {
      sendingRef.current = false;
    }
  }, [speak]);

  const clearSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
      currentWorkflow: null,
      currentStep: null,
      collectedParams: {},
      conversationContext: { ...DEFAULT_CONVERSATION_CONTEXT },
    }));
  }, []);

  const markGreeted = useCallback(() => {
    setState((prev) => ({ ...prev, hasGreeted: true }));
  }, []);

  const actions: FirdausActions = {
    wake,
    sleep,
    speak,
    sendMessage,
    setBusinessContext,
    clearSession,
    markGreeted,
    updateConversationContext,
    resetConversationContext,
    updateVoiceState,
    updateWorkflow,
  };

  return (
    <FirdausContext.Provider value={{ state, actions }}>
      {children}
    </FirdausContext.Provider>
  );
}
