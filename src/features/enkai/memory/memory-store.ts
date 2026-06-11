import type { AssistantMessage } from "../assistant/types";

interface SessionStore {
  messages: AssistantMessage[];
  context: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

class MemoryStore {
  private sessions: Map<string, SessionStore> = new Map();
  private maxMessagesPerSession = 100;

  getOrCreateSession(sessionId: string): SessionStore {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        messages: [],
        context: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  addMessage(sessionId: string, message: AssistantMessage): void {
    const session = this.getOrCreateSession(sessionId);
    session.messages.push(message);
    session.updatedAt = new Date();

    if (session.messages.length > this.maxMessagesPerSession) {
      session.messages = session.messages.slice(-this.maxMessagesPerSession);
    }
  }

  getHistory(sessionId: string): AssistantMessage[] {
    const session = this.sessions.get(sessionId);
    return session?.messages ?? [];
  }

  getRecentMessages(sessionId: string, count: number): AssistantMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return session.messages.slice(-count);
  }

  setContext(sessionId: string, key: string, value: unknown): void {
    const session = this.getOrCreateSession(sessionId);
    session.context[key] = value;
    session.updatedAt = new Date();
  }

  getContext(sessionId: string, key: string): unknown {
    const session = this.sessions.get(sessionId);
    return session?.context[key];
  }

  clearContext(sessionId: string, key: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      delete session.context[key];
    }
  }

  clear(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  clearAll(): void {
    this.sessions.clear();
  }

  getStats(): { totalSessions: number; totalMessages: number } {
    let totalMessages = 0;
    for (const session of this.sessions.values()) {
      totalMessages += session.messages.length;
    }
    return {
      totalSessions: this.sessions.size,
      totalMessages,
    };
  }
}

export const memoryStore = new MemoryStore();
