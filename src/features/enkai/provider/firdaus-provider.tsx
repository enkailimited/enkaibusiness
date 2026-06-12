"use client";

import { useCallback, useRef, useState } from "react";
import { FirdausContext, type FirdausState } from "./firdaus-context";
import { sendMessageAction } from "../actions/service-actions";
import type { AssistantMessage, AssistantContext } from "../assistant/types";
import type { FirdausActions } from "./firdaus-context";

const initialState: FirdausState = {
  isListening: false,
  isSpeaking: false,
  isAwake: false,
  messages: [],
  currentWorkflow: null,
  currentStep: null,
  collectedParams: {},
  businessId: null,
  userId: null,
  staffId: null,
  hasGreeted: false,
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
    setState((prev) => ({ ...prev, isAwake: false }));
  }, []);

  const setBusinessContext = useCallback((ctx: Partial<AssistantContext>) => {
    assistantContext.current = { ...assistantContext.current, ...ctx };
    setState((prev) => ({
      ...prev,
      businessId: ctx.businessId || prev.businessId,
      userId: ctx.userId || prev.userId,
      staffId: ctx.staffId || prev.staffId,
    }));
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: AssistantMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setState((prev) => ({ ...prev, messages: [...prev.messages, userMsg] }));

    try {
      const response = await sendMessageAction(text, assistantContext.current);

      const assistantMsg: AssistantMessage = {
        id: `asst_${Date.now()}`,
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
      };

      setState((prev) => ({ ...prev, messages: [...prev.messages, assistantMsg] }));

      if (response.actionData?.currentWorkflow) {
        setState((prev) => ({
          ...prev,
          currentWorkflow: response.actionData!.currentWorkflow as string,
          currentStep: response.actionData!.currentStep as string || null,
          collectedParams: response.actionData!.collectedParams as Record<string, unknown> || {},
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: `err_${Date.now()}`,
            role: "assistant",
            content: "Samahani, tatizo limetokea. Tafadhali jaribu tena.",
            timestamp: new Date(),
          },
        ],
      }));
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "sw-TZ";
    utterance.rate = 0.9;
    utterance.onstart = () => setState((prev) => ({ ...prev, isSpeaking: true }));
    utterance.onend = () => setState((prev) => ({ ...prev, isSpeaking: false }));
    utterance.onerror = () => setState((prev) => ({ ...prev, isSpeaking: false }));
    window.speechSynthesis.speak(utterance);
  }, []);

  const clearSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
      currentWorkflow: null,
      currentStep: null,
      collectedParams: {},
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
  };

  return (
    <FirdausContext.Provider value={{ state, actions }}>
      {children}
    </FirdausContext.Provider>
  );
}
