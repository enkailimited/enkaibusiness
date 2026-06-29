import "server-only";

import { prisma } from "@/server/db";

export interface AiActionLog {
  userId: string;
  businessId?: string;
  intent: string;
  input: string;
  response: string;
  success: boolean;
  durationMs: number;
  resolvedProductIds?: string[];
  resolvedProductNames?: string[];
  posFlowSteps?: string[];
  error?: string;
}

export async function logAiAction(data: AiActionLog): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        resourceId: data.intent,
        resourceType: "FIRDAUS_ACTION",
        action: data.intent,
        before: {
          input: data.input,
          resolvedProducts: data.resolvedProductNames || [],
          resolvedProductIds: data.resolvedProductIds || [],
        },
        after: {
          response: data.response,
          success: data.success,
          durationMs: data.durationMs,
          posFlowSteps: data.posFlowSteps || [],
          error: data.error || null,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch {}
}

export async function logBusinessMemory(
  businessId: string,
  type: "PREFERRED_SUPPLIER" | "TOP_CUSTOMER" | "COMMON_EXPENSE" | "POPULAR_PRODUCT" | "PAYMENT_METHOD" | "FREQUENT_PRODUCT" | "VOCABULARY" | "CONVERSATION_SUMMARY",
  key: string,
  value: string,
  confidence?: number,
): Promise<void> {
  try {
    await prisma.businessMemory.upsert({
      where: { businessId_type_key: { businessId, type, key } },
      update: {
        value,
        confidence: confidence ?? 0.7,
        updatedAt: new Date(),
      },
      create: {
        businessId,
        type,
        key,
        value,
        confidence: confidence ?? 0.7,
      },
    });
  } catch {}
}

export async function learnVocabulary(
  businessId: string,
  phrase: string,
  mappedIntent: string,
): Promise<void> {
  await logBusinessMemory(businessId, "VOCABULARY", phrase.toLowerCase().trim(), mappedIntent, 0.8);
}

export async function resolveVocabulary(
  businessId: string,
  input: string,
): Promise<string | null> {
  const normalized = input.toLowerCase().trim();
  const entries = await prisma.businessMemory.findMany({
    where: { businessId, type: "VOCABULARY" },
    select: { key: true, value: true },
  });

  for (const entry of entries) {
    if (normalized.includes(entry.key) || entry.key.includes(normalized)) {
      return entry.value;
    }
  }
  return null;
}

export async function summarizeConversation(
  businessId: string,
  userId: string,
  messages: Array<{ role: string; content: string }>,
): Promise<void> {
  if (messages.length < 4) return;

  const businessMessages = messages
    .filter((m) => m.role === "user")
    .slice(-10)
    .map((m) => m.content)
    .join(" | ");

  if (!businessMessages) return;

  await logBusinessMemory(
    businessId,
    "CONVERSATION_SUMMARY",
    `last_${userId.slice(0, 8)}`,
    businessMessages.slice(0, 500),
    0.6,
  );
}

export async function getBusinessKnowledge(businessId: string) {
  const memories = await prisma.businessMemory.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return {
    vocabulary: memories.filter((m) => m.type === "VOCABULARY"),
    popularProducts: memories.filter((m) => m.type === "POPULAR_PRODUCT"),
    topCustomers: memories.filter((m) => m.type === "TOP_CUSTOMER"),
    preferredSuppliers: memories.filter((m) => m.type === "PREFERRED_SUPPLIER"),
    paymentMethods: memories.filter((m) => m.type === "PAYMENT_METHOD"),
    conversationSummaries: memories.filter((m) => m.type === "CONVERSATION_SUMMARY"),
  };
}
