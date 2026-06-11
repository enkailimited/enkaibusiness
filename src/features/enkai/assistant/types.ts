import type { IntentType } from "../commands/types";

export type MessageRole = "user" | "assistant" | "system";

export interface AssistantMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface AssistantContext {
  businessId: string;
  branchId?: string;
  storeId?: string;
  userId: string;
  staffId?: string;
}

export interface AssistantResponse {
  message: string;
  intent: IntentType | null;
  confidence: number;
  actionRequired: boolean;
  actionData?: Record<string, unknown>;
}

export interface IntentHandler {
  intent: IntentType;
  handler: (params: Record<string, string | number | undefined>, context: AssistantContext) => Promise<AssistantResponse>;
}

export interface AssistantConfig {
  maxHistoryLength: number;
  systemPrompt: string;
}
