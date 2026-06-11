export { processMessage, getSessionHistory, clearSession } from "./assistant/assistant-service";
export type { AssistantMessage, AssistantContext, AssistantResponse, IntentHandler, AssistantConfig } from "./assistant/types";

export { processVoiceInput, isVoiceCommand } from "./voice/voice-service";
export type { VoiceInputResult } from "./voice/voice-service";

export { parseCommand, getHelpText, commands } from "./commands/command-parser";
export type { ParsedCommand, CommandDefinition, IntentMatchResult, IntentType } from "./commands/types";

export { sendMessageAction, getAssistantInsightsAction, evaluateAutomationRulesAction, clearAssistantMemoryAction, processVoiceAction } from "./actions/service-actions";

export { memoryStore } from "./memory/memory-store";

export { evaluateRules, getBusinessRules } from "./automation/automation-service";
export type { AutomationRule, AutomationTrigger, AutomationCondition, AutomationAction, AutomationResult } from "./automation/automation-service";

export { generateInsights, getCachedInsights } from "./insights/insights-service";
export type { BusinessInsight, InsightConfig, InsightType } from "./insights/insights-service";

export { systemPrompt, sellPrompt, stockCheckPrompt, customerLookupPrompt, reportPrompt, greetingPrompt, errorPrompt } from "./prompts/prompts";

export { toolRegistry } from "./tools/tool-registry";
export type { ToolDefinition, ToolParameter, ToolResult, ToolRegistry } from "./tools/types";
