"use client";

import { createContext, useContext } from "react";
import type { AssistantMessage, AssistantContext, FirdausMode } from "../assistant/types";
import { VoiceState } from "../voice/voice-state-machine";

export interface ConversationContext {
  business: string | null;
  branch: string | null;
  customer: string | null;
  customerId: string | null;
  supplier: string | null;
  supplierId: string | null;
  product: string | null;
  catalogId: string | null;
  quantity: number | null;
  unit: string | null;
  price: number | null;
  payment: string | null;
  previousQuestion: string | null;
  missingFields: string[];
  lastIntent: string | null;
  state: "active" | "completed" | "cancelled" | "timedout";
  expiresAt: number | null;
}

export interface FirdausState {
  isListening: boolean;
  isSpeaking: boolean;
  isAwake: boolean;
  voiceState: VoiceState;
  messages: AssistantMessage[];
  currentWorkflow: string | null;
  currentStep: string | null;
  collectedParams: Record<string, unknown>;
  conversationContext: ConversationContext;
  businessId: string | null;
  userId: string | null;
  staffId: string | null;
  hasGreeted: boolean;
  mode: FirdausMode;
}

export const DEFAULT_CONVERSATION_CONTEXT: ConversationContext = {
  business: null,
  branch: null,
  customer: null,
  customerId: null,
  supplier: null,
  supplierId: null,
  product: null,
  catalogId: null,
  quantity: null,
  unit: null,
  price: null,
  payment: null,
  previousQuestion: null,
  missingFields: [],
  lastIntent: null,
  state: "active",
  expiresAt: null,
};

export interface FirdausActions {
  wake: () => void;
  sleep: () => void;
  speak: (text: string) => void;
  sendMessage: (text: string) => Promise<void>;
  setBusinessContext: (ctx: Partial<AssistantContext>) => void;
  clearSession: () => void;
  markGreeted: () => void;
  updateConversationContext: (partial: Partial<ConversationContext>) => void;
  resetConversationContext: () => void;
  updateVoiceState: (vs: VoiceState) => void;
  updateWorkflow: (wf: string | null, step: string | null) => void;
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
