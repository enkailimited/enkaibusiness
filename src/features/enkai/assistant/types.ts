import type { IntentType } from "../commands/types";

export type MessageRole = "user" | "assistant" | "system";

export interface AssistantMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export type FirdausMode = "platform" | "workspace" | "generic";

export interface AssistantContext {
  userId: string;
  businessId?: string;
  branchId?: string;
  storeId?: string;
  staffId?: string;
  roles?: string[];
  permissions?: string[];
  workspaceId?: string;
  salesHierarchyLevel?: string;
  mode?: FirdausMode;
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

export interface WorkflowStep {
  field: string;
  question: string;
  required: boolean;
  validator?: (value: string) => boolean;
}

export interface WorkflowDefinition {
  intent: IntentType;
  steps: WorkflowStep[];
  execute: (params: Record<string, string | number | undefined>, context: AssistantContext) => Promise<AssistantResponse>;
}
