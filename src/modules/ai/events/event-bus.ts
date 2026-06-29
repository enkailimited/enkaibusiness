import "server-only";

import { prisma } from "@/server/db";

export type FirdausEventType =
  | "SaleCreated"
  | "SaleUpdated"
  | "SaleVoided"
  | "SaleDeleted"
  | "PurchaseCreated"
  | "PurchaseUpdated"
  | "PurchaseCancelled"
  | "GoodsReceived"
  | "InvoicePaid"
  | "InvoiceCreated"
  | "ExpenseCreated"
  | "ExpenseUpdated"
  | "StockTransferCreated"
  | "StockTransferCompleted"
  | "CustomerCreated"
  | "CustomerUpdated"
  | "SupplierCreated"
  | "SupplierUpdated"
  | "PaymentReceived"
  | "PaymentRefunded"
  | "InventoryAdjusted"
  | "InventoryLow"
  | "CreditGiven"
  | "UserRegistered"
  | "UserAssignedToContext"
  | "BusinessCreated"
  | "BusinessActivated"
  | "BusinessSuspended"
  | "SubscriptionActivated"
  | "SubscriptionCancelled"
  | "WalletFunded"
  | "WalletWithdrawn";

export interface FirdausEvent {
  type: FirdausEventType;
  businessId: string;
  userId: string;
  entityId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export type EventHandler = (event: FirdausEvent) => Promise<void>;

const MAX_RETRIES = 3;

class FirdausEventBus {
  private handlers: Map<FirdausEventType, EventHandler[]> = new Map();
  private processing: boolean = false;

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
    const record = await prisma.eventRecord.create({
      data: {
        type: event.type,
        businessId: event.businessId,
        userId: event.userId,
        entityId: event.entityId,
        data: event.data as Record<string, unknown>,
        status: "pending",
        attempts: 0,
      },
    });

    await this.executeHandlers(event, record.id);
  }

  private async executeHandlers(event: FirdausEvent, recordId: string): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];

    if (handlers.length === 0) {
      await prisma.eventRecord.update({
        where: { id: recordId },
        data: { status: "completed", processedAt: new Date() },
      });
      return;
    }

    await prisma.eventRecord.update({
      where: { id: recordId },
      data: { status: "processing" },
    });

    const results = await Promise.allSettled(handlers.map((handler) => handler(event)));
    const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];

    if (failures.length === 0) {
      await prisma.eventRecord.update({
        where: { id: recordId },
        data: { status: "completed", processedAt: new Date() },
      });
    } else {
      const record = await prisma.eventRecord.findUnique({ where: { id: recordId } });
      const attemptCount = (record?.attempts ?? 0) + 1;
      const errorMsg = failures.map((f) => String(f.reason)).join("; ");

      if (attemptCount >= MAX_RETRIES) {
        await prisma.eventRecord.update({
          where: { id: recordId },
          data: { status: "failed", attempts: attemptCount, error: errorMsg },
        });
      } else {
        await prisma.eventRecord.update({
          where: { id: recordId },
          data: { status: "pending", attempts: attemptCount, error: errorMsg },
        });
      }
    }
  }

  async processPendingEvents(batchSize: number = 50): Promise<number> {
    if (this.processing) return 0;
    this.processing = true;

    try {
      const pending = await prisma.eventRecord.findMany({
        where: { status: "pending", attempts: { lt: MAX_RETRIES } },
        orderBy: { createdAt: "asc" },
        take: batchSize,
      });

      for (const record of pending) {
        const event: FirdausEvent = {
          type: record.type as FirdausEventType,
          businessId: record.businessId ?? "",
          userId: record.userId ?? "",
          entityId: record.entityId ?? "",
          data: (record.data ?? {}) as Record<string, unknown>,
          timestamp: record.createdAt,
        };
        await this.executeHandlers(event, record.id);
      }

      return pending.length;
    } finally {
      this.processing = false;
    }
  }

  async retryFailed(batchSize: number = 20): Promise<number> {
    const failed = await prisma.eventRecord.findMany({
      where: { status: "failed", attempts: { lt: MAX_RETRIES } },
      orderBy: { createdAt: "asc" },
      take: batchSize,
    });

    for (const record of failed) {
      await prisma.eventRecord.update({
        where: { id: record.id },
        data: { status: "pending", error: null },
      });
    }

    return failed.length;
  }

  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const [pending, processing, completed, failed] = await Promise.all([
      prisma.eventRecord.count({ where: { status: "pending" } }),
      prisma.eventRecord.count({ where: { status: "processing" } }),
      prisma.eventRecord.count({ where: { status: "completed" } }),
      prisma.eventRecord.count({ where: { status: "failed" } }),
    ]);
    return { pending, processing, completed, failed };
  }
}

export const firdausEventBus = new FirdausEventBus();

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
            type: "alert",
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

  firdausEventBus.on("InventoryLow", async (event) => {
    try {
      const name = String(event.data.productName || "Bidhaa");
      const level = Number(event.data.stockLevel || 0);
      await prisma.notification.create({
        data: {
          businessId: event.businessId,
          userId: event.userId,
          type: "warning",
          title: "Bidhaa Zinahitaji Kuagizwa",
          message: `${name}: stoo imebaki ${level}. Tafadhali agiza.`,
          link: "/inventory",
        },
      });
    } catch {}
  });

  firdausEventBus.on("BusinessActivated", async (event) => {
    try {
      await prisma.notification.create({
        data: {
          businessId: event.businessId,
          userId: event.userId,
          type: "success",
          title: "Biashara Imewashwa",
          message: "Hongera! Biashara yako sasa iko aktifu.",
          link: "/platform/dashboard",
        },
      });
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

export function emitSaleUpdated(
  businessId: string, userId: string, saleId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "SaleUpdated", businessId, userId, entityId: saleId, data, timestamp: new Date(),
  });
}

export function emitSaleVoided(
  businessId: string, userId: string, saleId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "SaleVoided", businessId, userId, entityId: saleId, data, timestamp: new Date(),
  });
}

export function emitPurchaseCreated(
  businessId: string, userId: string, purchaseId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "PurchaseCreated", businessId, userId, entityId: purchaseId, data, timestamp: new Date(),
  });
}

export function emitGoodsReceived(
  businessId: string, userId: string, goodsReceivedId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "GoodsReceived", businessId, userId, entityId: goodsReceivedId, data, timestamp: new Date(),
  });
}

export function emitInvoicePaid(
  businessId: string, userId: string, invoiceId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "InvoicePaid", businessId, userId, entityId: invoiceId, data, timestamp: new Date(),
  });
}

export function emitInvoiceCreated(
  businessId: string, userId: string, invoiceId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "InvoiceCreated", businessId, userId, entityId: invoiceId, data, timestamp: new Date(),
  });
}

export function emitExpenseCreated(
  businessId: string, userId: string, expenseId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "ExpenseCreated", businessId, userId, entityId: expenseId, data, timestamp: new Date(),
  });
}

export function emitPaymentReceived(
  businessId: string, userId: string, paymentId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "PaymentReceived", businessId, userId, entityId: paymentId, data, timestamp: new Date(),
  });
}

export function emitInventoryAdjusted(
  businessId: string, userId: string, itemId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "InventoryAdjusted", businessId, userId, entityId: itemId, data, timestamp: new Date(),
  });
}

export function emitInventoryLow(
  businessId: string, userId: string, itemId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "InventoryLow", businessId, userId, entityId: itemId, data, timestamp: new Date(),
  });
}

export function emitBusinessActivated(
  businessId: string, userId: string, entityId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "BusinessActivated", businessId, userId, entityId, data, timestamp: new Date(),
  });
}

export function emitWalletFunded(
  businessId: string, userId: string, walletId: string, data: Record<string, unknown>,
): void {
  firdausEventBus.emit({
    type: "WalletFunded", businessId, userId, entityId: walletId, data, timestamp: new Date(),
  });
}
