import { prisma } from "@/server/db";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface BusinessKnowledge {
  key: string;
  value: string;
  type: "learned" | "configured" | "inferred";
  confidence: number;
}

const sessionMemory = new Map<string, ConversationMessage[]>();
const MAX_SESSION_MESSAGES = 100;

function getSession(sessionId: string): ConversationMessage[] {
  if (!sessionMemory.has(sessionId)) {
    sessionMemory.set(sessionId, []);
  }
  return sessionMemory.get(sessionId)!;
}

export function addToSession(sessionId: string, message: ConversationMessage): void {
  const session = getSession(sessionId);
  session.push(message);
  if (session.length > MAX_SESSION_MESSAGES) session.shift();
}

export function getSessionHistory(sessionId: string, limit?: number): ConversationMessage[] {
  const session = getSession(sessionId);
  return limit ? session.slice(-limit) : [...session];
}

export function clearSession(sessionId: string): void {
  sessionMemory.delete(sessionId);
}

export function getSessionStats(): { sessions: number; messages: number } {
  let messages = 0;
  for (const [, msgs] of sessionMemory) messages += msgs.length;
  return { sessions: sessionMemory.size, messages };
}

export async function getBusinessMemory(businessId: string): Promise<BusinessKnowledge[]> {
  const records = await prisma.businessMemory.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });

  return records.map((r) => ({
    key: r.key,
    value: r.value,
    type: (r.type as "learned" | "configured" | "inferred") ?? "learned",
    confidence: Number(r.confidence ?? 0.5),
  }));
}

export async function saveBusinessMemory(
  businessId: string,
  key: string,
  value: string,
  type: "learned" | "configured" | "inferred" = "learned",
  confidence: number = 0.5,
): Promise<void> {
  await prisma.businessMemory.upsert({
    where: { businessId_key: { businessId, key } },
    update: { value, type, confidence, updatedAt: new Date() },
    create: { businessId, key, value, type, confidence },
  });
}
