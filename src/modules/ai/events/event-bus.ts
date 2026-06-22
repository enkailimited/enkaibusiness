import "server-only";

import { prisma } from "@/server/db";

export type FirdausEventType =
  | "SaleCreated"
  | "PurchaseCreated"
  | "InvoicePaid"
  | "ExpenseCreated"
  | "StockTransferCreated"
  | "CustomerCreated"
  | "SupplierCreated"
  | "PaymentReceived"
  | "InventoryAdjusted"
  | "CreditGiven";

export interface FirdausEvent {
  type: FirdausEventType;
  businessId: string;
  userId: string;
  entityId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export type EventHandler = (event: FirdausEvent) => Promise<void>;

class FirdausEventBus {
  private handlers: Map<FirdausEventType, EventHandler[]> = new Map();
  private history: FirdausEvent[] = [];

  on(type: FirdausEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(type) || [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
  }

  off(type: FirdausEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(type) || [];
    this.handlers.set(type, handlers.filter((h) => h !== handler));
  }

  async emit(event: FirdausEvent): Promise<void> {
    this.history.push(event);
    if (this.history.length > 100) this.history.shift();

    const handlers = this.handlers.get(event.type) || [];
    await Promise.allSettled(handlers.map((handler) => handler(event)));

    try {
      await prisma.auditLog.create({
        data: {
          userId: event.userId,
          businessId: event.businessId,
          action: `FIRDAUS_EVENT_${event.type}`,
          entity: "FIRDAUS_EVENT",
          entityId: event.entityId,
          before: null,
          after: { type: event.type, data: event.data, timestamp: event.timestamp.toISOString() },
        },
      });
    } catch {}
  }

  getHistory(type?: FirdausEventType): FirdausEvent[] {
    if (type) return this.history.filter((e) => e.type === type);
    return [...this.history];
  }

  clear(): void {
    this.history = [];
  }
}

export const firdausEventBus = new FirdausEventBus();

// Register default handlers
export function registerDefaultHandlers(): void {
  const { reorderEngine } = require("../inventory/reorder-engine");

  firdausEventBus.on("SaleCreated", async (event) => {
    try {
      const recommendations = await reorderEngine.getReorderRecommendations(event.businessId);
      const urgent = recommendations.filter((r) => r.priority === "immediate" || r.priority === "today");
      if (urgent.length > 0) {
        await prisma.notification.create({
          data: {
            businessId: event.businessId,
            userId: event.userId,
            type: "system",
            title: "Mapendekezo ya Kuagiza",
            message: `Bidhaa ${urgent.length} zinahitaji kuagizwa haraka.`,
            link: "/inventory",
          },
        });
      }
    } catch {}
  });

  firdausEventBus.on("ExpenseCreated", async (event) => {
    try {
      const amount = Number(event.data.amount || 0);
      if (amount > 100000) {
        await prisma.notification.create({
          data: {
            businessId: event.businessId,
            userId: event.userId,
            type: "warning",
            title: "Gharama Kubwa Imerekodiwa",
            message: `Gharama ya Tsh ${amount.toLocaleString()} imerekodiwa.`,
            link: "/expenses",
          },
        });
      }
    } catch {}
  });

  firdausEventBus.on("InvoicePaid", async (event) => {
    try {
      const amount = Number(event.data.amount || 0);
      if (amount > 0) {
        await prisma.notification.create({
          data: {
            businessId: event.businessId,
            userId: event.userId,
            type: "success",
            title: "Malipo Yamepokelewa",
            message: `Malipo ya Tsh ${amount.toLocaleString()} yamepokelewa.`,
            link: "/invoices",
          },
        });
      }
    } catch {}
  });
}

export function emitSaleCreated(
  businessId: string, userId: string, saleId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "SaleCreated", businessId, userId, entityId: saleId, data, timestamp: new Date(),
  });
}

export function emitPurchaseCreated(
  businessId: string, userId: string, purchaseId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "PurchaseCreated", businessId, userId, entityId: purchaseId, data, timestamp: new Date(),
  });
}

export function emitInvoicePaid(
  businessId: string, userId: string, invoiceId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "InvoicePaid", businessId, userId, entityId: invoiceId, data, timestamp: new Date(),
  });
}

export function emitExpenseCreated(
  businessId: string, userId: string, expenseId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "ExpenseCreated", businessId, userId, entityId: expenseId, data, timestamp: new Date(),
  });
}
