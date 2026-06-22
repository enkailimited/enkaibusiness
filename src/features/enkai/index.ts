// Server-only exports (import these directly when needed)
// export { processMessage, getSessionHistory, clearSession } from "./assistant/assistant-service";
// export { parseCommand, getHelpText, commands } from "./commands/command-parser";
// export { toolRegistry } from "./tools/tool-registry";
// export { checkPermission, checkSalesHierarchy } from "./services/permission-service";
// export { generateProactiveInsights } from "./services/proactive-insights";
// export { createBusiness, getSetupStepQuestion, getWorkspaceId } from "./workflows/business-setup";
// export { evaluateRules, getBusinessRules } from "./automation/automation-service";
// export { generateInsights, getCachedInsights } from "./insights/insights-service";
// export { memoryStore } from "./memory/memory-store";
// export { processVoiceInput, isVoiceCommand } from "./voice/voice-service";

// Types (safe for client)
export type { AssistantMessage, AssistantContext, AssistantResponse, IntentHandler, AssistantConfig } from "./assistant/types";
export type { ParsedCommand, CommandDefinition, IntentMatchResult, IntentType } from "./commands/types";
export type { ToolDefinition, ToolParameter, ToolResult, ToolRegistry } from "./tools/types";
export type { VoiceInputResult } from "./voice/voice-service";
export type { PermissionCheck } from "./services/permission-service";
export type { BusinessSetupData } from "./workflows/business-setup";
export type { WorkflowState, WorkflowStep, WorkflowType } from "./services/workflow-engine";
export type { ProactiveInsight } from "./services/proactive-insights";
export type { FirdausState, FirdausActions, FirdausContextType } from "./provider/firdaus-context";

// Client-safe exports
export { FirdausProvider } from "./provider/firdaus-provider";
export { FirdausContext, useFirdausContext } from "./provider/firdaus-context";

export { useFirdaus, useFirdausBusiness } from "./hooks/use-firdaus";
export type { PageContext } from "./hooks/use-firdaus";


export { classifyExpense } from "./services/expense-classifier";
export type { ExpenseCategory, ClassificationResult } from "./services/expense-classifier";

export { FirdausInsights } from "./components/firdaus-insights";
export { FirdausGlobalListener } from "./components/firdaus-global-listener";
export { FirdausToast } from "./components/firdaus-toast";
export { FirdausResponseToast } from "./components/firdaus-response-toast";
