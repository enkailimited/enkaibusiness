"use client";

import { createContext, useContext } from "react";
import type { AssistantMessage, AssistantContext, FirdausMode } from "../assistant/types";

export interface FirdausState {
  isListening: boolean;
  isSpeaking: boolean;
  isAwake: boolean;
  messages: AssistantMessage[];
  currentWorkflow: string | null;
  currentStep: string | null;
  collectedParams: Record<string, unknown>;
  businessId: string | null;
  userId: string | null;
  staffId: string | null;
  hasGreeted: boolean;
  mode: FirdausMode;
}

export interface FirdausActions {
  wake: () => void;
  sleep: () => void;
  speak: (text: string) => void;
  sendMessage: (text: string) => Promise<void>;
  setBusinessContext: (ctx: Partial<AssistantContext>) => void;
  clearSession: () => void;
  markGreeted: () => void;
}

export interface FirdausContextType {
  state: FirdausState;
  actions: FirdausActions;
}

export const FirdausContext = createContext<FirdausContextType | null>(null);

export function useFirdausContext(): FirdausContextType {
  const ctx = useContext(FirdausContext);
  if (!ctx) {
    throw new Error("useFirdausContext must be used within FirdausProvider");
  }
  return ctx;
}
