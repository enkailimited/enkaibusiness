import "server-only";

import { parseCommand } from "../commands/command-parser";
import { memoryStore } from "../memory/memory-store";
import { toolRegistry } from "../tools/tool-registry";
import { systemPrompt } from "../prompts/prompts";
import type { AssistantMessage, AssistantContext, AssistantResponse, IntentHandler } from "./types";
import type { IntentType } from "../commands/types";

const config = {
  maxHistoryLength: 50,
  systemPrompt,
};

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const intentHandlers: IntentHandler[] = [
  {
    intent: "check-stock",
    handler: async (params, context) => {
      const item = params.item as string | undefined;
      if (!item) {
        return {
          message: "Please specify an item to check stock for.",
          intent: "check-stock",
          confidence: 1,
          actionRequired: false,
        };
      }
      const result = await toolRegistry.execute("check-stock", { item, businessId: context.businessId });
      return {
        message: result.message || `Stock check completed for ${item}.`,
        intent: "check-stock",
        confidence: 1,
        actionRequired: false,
        actionData: result.data,
      };
    },
  },
  {
    intent: "sell",
    handler: async (params, context) => {
      const quantity = params.quantity;
      const item = params.item as string | undefined;
      if (!quantity || !item) {
        return {
          message: "Please specify both quantity and item. Example: sell 2kg sugar",
          intent: "sell",
          confidence: 0.5,
          actionRequired: false,
        };
      }
      const result = await toolRegistry.execute("sell", {
        quantity,
        item,
        businessId: context.businessId,
        staffId: context.staffId,
      });
      return {
        message: result.message || `Sale recorded: ${quantity} of ${item}.`,
        intent: "sell",
        confidence: 1,
        actionRequired: "actionRequired" in result ? Boolean(result.actionRequired) : false,
        actionData: result.data,
      };
    },
  },
  {
    intent: "check-price",
    handler: async (params, context) => {
      const item = params.item as string | undefined;
      if (!item) {
        return {
          message: "Please specify an item to check price for.",
          intent: "check-price",
          confidence: 1,
          actionRequired: false,
        };
      }
      const result = await toolRegistry.execute("check-price", { item, businessId: context.businessId });
      return {
        message: result.message || `Price check for ${item}.`,
        intent: "check-price",
        confidence: 1,
        actionRequired: false,
        actionData: result.data,
      };
    },
  },
  {
    intent: "lookup-customer",
    handler: async (params) => {
      const query = (params.query || params.phone || params.name) as string | undefined;
      if (!query) {
        return {
          message: "Please provide a customer name or phone number.",
          intent: "lookup-customer",
          confidence: 0.8,
          actionRequired: false,
        };
      }
      const result = await toolRegistry.execute("lookup-customer", { query });
      return {
        message: result.message || `Customer lookup for ${query}.`,
        intent: "lookup-customer",
        confidence: 1,
        actionRequired: false,
        actionData: result.data,
      };
    },
  },
  {
    intent: "add-customer",
    handler: async (params) => {
      const name = params.name as string | undefined;
      const phone = params.phone as string | undefined;
      if (!name || !phone) {
        return {
          message: "Please provide both name and phone number. Example: add-customer John 255712345678",
          intent: "add-customer",
          confidence: 0.6,
          actionRequired: false,
        };
      }
      const result = await toolRegistry.execute("add-customer", { name, phone });
      return {
        message: result.message || `Customer ${name} added successfully.`,
        intent: "add-customer",
        confidence: 1,
        actionRequired: false,
        actionData: result.data,
      };
    },
  },
  {
    intent: "help",
    handler: async () => {
      const { getHelpText } = await import("../commands/command-parser");
      return {
        message: getHelpText(),
        intent: "help",
        confidence: 1,
        actionRequired: false,
      };
    },
  },
  {
    intent: "view-orders",
    handler: async (_, context) => {
      const result = await toolRegistry.execute("view-orders", { businessId: context.businessId });
      return {
        message: result.message || "Recent orders retrieved.",
        intent: "view-orders",
        confidence: 1,
        actionRequired: false,
        actionData: result.data,
      };
    },
  },
  {
    intent: "view-report",
    handler: async (params) => {
      const type = params.type as string | undefined;
      if (!type) {
        return {
          message: "Please specify report type: sales, stock, staff, or customers.",
          intent: "view-report",
          confidence: 0.7,
          actionRequired: false,
        };
      }
      const result = await toolRegistry.execute("view-report", { type });
      return {
        message: result.message || `${type} report generated.`,
        intent: "view-report",
        confidence: 1,
        actionRequired: false,
        actionData: result.data,
      };
    },
  },
  {
    intent: "check-staff",
    handler: async (params) => {
      const name = params.name as string | undefined;
      const result = await toolRegistry.execute("check-staff", { name });
      return {
        message: result.message || "Staff information retrieved.",
        intent: "check-staff",
        confidence: 1,
        actionRequired: false,
        actionData: result.data,
      };
    },
  },
  {
    intent: "create-sale",
    handler: async (params, context) => {
      const description = params.description as string | undefined;
      const result = await toolRegistry.execute("create-sale", {
        description,
        businessId: context.businessId,
        staffId: context.staffId,
      });
      return {
        message: result.message || "Sale created.",
        intent: "create-sale",
        confidence: 0.8,
        actionRequired: "actionRequired" in result ? Boolean(result.actionRequired) : true,
        actionData: result.data,
      };
    },
  },
  {
    intent: "create-order",
    handler: async (params, context) => {
      const item = params.item as string | undefined;
      const quantity = params.quantity;
      const result = await toolRegistry.execute("create-order", {
        item,
        quantity,
        businessId: context.businessId,
      });
      return {
        message: result.message || `Order for ${quantity} of ${item} created.`,
        intent: "create-order",
        confidence: 0.8,
        actionRequired: false,
        actionData: result.data,
      };
    },
  },
];

function findHandler(intent: IntentType): IntentHandler | undefined {
  return intentHandlers.find((h) => h.intent === intent);
}

export async function processMessage(
  input: string,
  context: AssistantContext,
  sessionId?: string,
): Promise<AssistantResponse> {
  const history = sessionId ? memoryStore.getHistory(sessionId) : [];
  const session = sessionId || `session_${context.userId}_${Date.now()}`;

  const userMessage: AssistantMessage = {
    id: generateId(),
    role: "user",
    content: input,
    timestamp: new Date(),
  };

  memoryStore.addMessage(session, userMessage);

  const parsed = parseCommand(input);

  if (parsed.intent === "unknown" && parsed.confidence === 0) {
    const response: AssistantResponse = {
      message: "I didn't understand that. Type /help to see available commands.",
      intent: null,
      confidence: 0,
      actionRequired: false,
    };

    memoryStore.addMessage(session, {
      id: generateId(),
      role: "assistant",
      content: response.message,
      timestamp: new Date(),
    });

    return response;
  }

  const handler = findHandler(parsed.intent);
  if (!handler) {
    const response: AssistantResponse = {
      message: `I don't know how to handle "${parsed.intent}" yet. Type /help to see what I can do.`,
      intent: parsed.intent,
      confidence: parsed.confidence,
      actionRequired: false,
    };

    memoryStore.addMessage(session, {
      id: generateId(),
      role: "assistant",
      content: response.message,
      timestamp: new Date(),
    });

    return response;
  }

  try {
    const response = await handler.handler(parsed.params, context);

    memoryStore.addMessage(session, {
      id: generateId(),
      role: "assistant",
      content: response.message,
      timestamp: new Date(),
    });

    if (history.length > config.maxHistoryLength) {
      memoryStore.clear(session);
    }

    return response;
  } catch (error) {
    console.error("Assistant handler error:", error);
    return {
      message: "An error occurred while processing your request. Please try again.",
      intent: parsed.intent,
      confidence: parsed.confidence,
      actionRequired: false,
    };
  }
}

export function getSessionHistory(sessionId: string): AssistantMessage[] {
  return memoryStore.getHistory(sessionId);
}

export function clearSession(sessionId: string): void {
  memoryStore.clear(sessionId);
}
