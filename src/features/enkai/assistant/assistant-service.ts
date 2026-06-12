import "server-only";

import { prisma } from "@/server/db";
import { parseCommand, getHelpText } from "../commands/command-parser";
import { memoryStore } from "../memory/memory-store";
import { toolRegistry } from "../tools/tool-registry";
import { systemPrompt, greetingSwahili, helpSwahili, noPermission, incompleteTransaction, successMessage, errorMessage } from "../prompts/prompts";
import type { AssistantMessage, AssistantContext, AssistantResponse, IntentHandler, WorkflowDefinition } from "./types";
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
          message: incompleteTransaction("jina la bidhaa"),
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
      if (!quantity && !item) {
        return {
          message: `Umeuza bidhaa gani?`,
          intent: "sell",
          confidence: 0.5,
          actionRequired: false,
        };
      }
      if (!quantity) {
        return {
          message: `Umeuza kiasi gani cha ${item || "bidhaa"}?`,
          intent: "sell",
          confidence: 0.5,
          actionRequired: false,
        };
      }
      if (!item) {
        return {
          message: `Umeuza bidhaa gani?`,
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
          message: "Tafadhali taja bidhaa.",
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
          message: "Tafadhali toa jina la mteja au namba ya simu.",
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
      if (!name) {
        return {
          message: "Tafadhali toa jina la mteja.",
          intent: "add-customer",
          confidence: 0.6,
          actionRequired: false,
        };
      }
      if (!phone) {
        return {
          message: `Tafadhali toa namba ya simu ya ${name}.`,
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
    intent: "add-expense",
    handler: async (params, context) => {
      const amount = params.amount;
      const description = params.description as string | undefined;
      if (!amount) {
        return {
          message: "Gharama ni kiasi gani?",
          intent: "add-expense",
          confidence: 0.6,
          actionRequired: false,
        };
      }
      if (!description) {
        return {
          message: "Gharama hii ni ya nini? (mf: mafuta, usafiri, internet, umeme, kodi)",
          intent: "add-expense",
          confidence: 0.6,
          actionRequired: false,
        };
      }
      const result = await toolRegistry.execute("add-expense", {
        amount: Number(amount),
        description,
        businessId: context.businessId,
      });
      return {
        message: result.message || `Expense recorded: ${amount}`,
        intent: "add-expense",
        confidence: 1,
        actionRequired: false,
        actionData: result.data,
      };
    },
  },
  {
    intent: "add-purchase",
    handler: async (params, context) => {
      const item = params.item as string | undefined;
      const quantity = params.quantity;
      const cost = params.cost;
      if (!item) {
        return {
          message: "Umenunua bidhaa gani?",
          intent: "add-purchase",
          confidence: 0.6,
          actionRequired: false,
        };
      }
      if (!quantity) {
        return {
          message: `Umenunua kiasi gani cha ${item}?`,
          intent: "add-purchase",
          confidence: 0.6,
          actionRequired: false,
        };
      }
      if (!cost) {
        return {
          message: `Umenunua kwa bei gani kwa kila ${item}?`,
          intent: "add-purchase",
          confidence: 0.6,
          actionRequired: false,
        };
      }
      const result = await toolRegistry.execute("add-purchase", {
        item,
        quantity: Number(quantity),
        cost: Number(cost),
        businessId: context.businessId,
      });
      return {
        message: result.message || `Purchase recorded: ${quantity} of ${item}.`,
        intent: "add-purchase",
        confidence: 1,
        actionRequired: false,
        actionData: result.data,
      };
    },
  },
  {
    intent: "lookup-supplier",
    handler: async (params) => {
      const query = (params.query || params.name) as string | undefined;
      if (!query) {
        return {
          message: "Tafadhali toa jina la msambazaji.",
          intent: "lookup-supplier",
          confidence: 0.6,
          actionRequired: false,
        };
      }
      const result = await toolRegistry.execute("lookup-supplier", { query });
      return {
        message: result.message || `Supplier lookup for ${query}.`,
        intent: "lookup-supplier",
        confidence: 1,
        actionRequired: false,
        actionData: result.data,
      };
    },
  },
  {
    intent: "add-supplier",
    handler: async (params) => {
      const name = params.name as string | undefined;
      const phone = params.phone as string | undefined;
      if (!name) {
        return {
          message: "Tafadhali toa jina la msambazaji.",
          intent: "add-supplier",
          confidence: 0.6,
          actionRequired: false,
        };
      }
      if (!phone) {
        return {
          message: `Tafadhali toa namba ya simu ya ${name}.`,
          intent: "add-supplier",
          confidence: 0.6,
          actionRequired: false,
        };
      }
      const result = await toolRegistry.execute("add-supplier", { name, phone });
      return {
        message: result.message || `Supplier ${name} added successfully.`,
        intent: "add-supplier",
        confidence: 1,
        actionRequired: false,
        actionData: result.data,
      };
    },
  },
  {
    intent: "help",
    handler: async () => {
      return {
        message: helpSwahili,
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
    handler: async (params, context) => {
      const type = params.type as string | undefined;
      if (!type) {
        return {
          message: "Tafadhali chagua aina ya ripoti: sales, stock, staff, customers, au profit.",
          intent: "view-report",
          confidence: 0.7,
          actionRequired: false,
        };
      }
      const result = await toolRegistry.execute("view-report", { type, businessId: context.businessId });
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
    handler: async (params, context) => {
      const name = params.name as string | undefined;
      const result = await toolRegistry.execute("check-staff", { name, businessId: context.businessId });
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
  {
    intent: "transfer-stock",
    handler: async (params, context) => {
      const item = params.item as string | undefined;
      const quantity = params.quantity;
      const from = params.from as string | undefined;
      const to = params.to as string | undefined;
      if (!item || !quantity || !from || !to) {
        return {
          message: "Tafadhali toa: bidhaa, idadi, sehemu ya kutoka na sehemu ya kwenda.",
          intent: "transfer-stock",
          confidence: 0.6,
          actionRequired: false,
        };
      }
      const result = await toolRegistry.execute("transfer-stock", {
        item,
        quantity: Number(quantity),
        from,
        to,
        businessId: context.businessId,
      });
      return {
        message: result.message || `Transferred ${quantity} of ${item}.`,
        intent: "transfer-stock",
        confidence: 1,
        actionRequired: false,
        actionData: result.data,
      };
    },
  },
  {
    intent: "check-wallet",
    handler: async (_, context) => {
      const result = await toolRegistry.execute("check-wallet", { businessId: context.businessId });
      return {
        message: result.message || "Wallet info retrieved.",
        intent: "check-wallet",
        confidence: 1,
        actionRequired: false,
        actionData: result.data,
      };
    },
  },
  {
    intent: "business-insights",
    handler: async (_, context) => {
      try {
        const { generateBusinessInsights } = await import("@/enkai/intelligence/business-insights/insights-engine");
        const insights = await generateBusinessInsights(context.businessId!);
        const insightMessages = insights.map((i: { type: string; title: string; description: string; severity: string }) =>
          `${i.type === "opportunity" ? "⚡" : i.type === "warning" ? "⚠️" : "ℹ️"} **${i.title}**: ${i.description}`
        ).join("\n\n");
        return {
          message: `**Maarifa ya Biashara**\n\n${insightMessages || "Hakuna maarifa mapya kwa sasa."}`,
          intent: "business-insights",
          confidence: 1,
          actionRequired: false,
          actionData: { insights },
        };
      } catch {
        return {
          message: "Samahani, siwezi kupata maarifa ya biashara kwa sasa. Tafadhali jaribu tena baadaye.",
          intent: "business-insights",
          confidence: 0.5,
          actionRequired: false,
        };
      }
    },
  },
];

function findHandler(intent: IntentType): IntentHandler | undefined {
  return intentHandlers.find((h) => h.intent === intent);
}

async function checkPermission(context: AssistantContext, requiredPermission?: string): Promise<boolean> {
  if (!requiredPermission || !context.userId) return true;
  if (context.permissions && context.permissions.includes(requiredPermission)) return true;
  if (context.permissions && context.permissions.includes("*")) return true;
  return false;
}

async function createAuditLog(
  userId: string,
  businessId: string | undefined,
  action: string,
  details: Record<string, unknown>,
): Promise<void> {
  try {
    const { prisma } = await import("@/server/db");
    await prisma.auditLog.create({
      data: {
        userId,
        businessId: businessId || "",
        action,
        entity: "firdaus_assistant",
        entityId: action,
        before: null,
        after: details,
      },
    });
  } catch (err) {
    console.error("Failed to create audit log:", err);
  }
}

export async function processMessage(
  input: string,
  context: AssistantContext,
  sessionId?: string,
): Promise<AssistantResponse> {
  const session = sessionId || `session_${context.userId}_${Date.now()}`;

  memoryStore.addMessage(session, {
    id: generateId(),
    role: "user",
    content: input,
    timestamp: new Date(),
  });

  try {
    const brainResponse = await processWithBrain({
      input,
      context,
    });

    const response: AssistantResponse = {
      message: brainResponse.message,
      intent: null,
      confidence: 1,
      actionRequired: !!brainResponse.workflow,
      actionData: {
        ...brainResponse.data,
        currentWorkflow: brainResponse.workflow,
        currentStep: brainResponse.step,
      },
    };

    memoryStore.addMessage(session, {
      id: generateId(),
      role: "assistant",
      content: response.message,
      timestamp: new Date(),
    });

    return response;
  } catch (error) {
    console.error("Firdaus brain error:", error);
    return {
      message: errorMessage(error instanceof Error ? error.message : "Tatizo la mfumo"),
      intent: null,
      confidence: 0,
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
