import "server-only";

import type { OrderStatus } from "./types";

const ORDER_STATE_MACHINE: Record<OrderStatus, OrderStatus[]> = {
  draft: ["quotation", "confirmed", "cancelled"],
  quotation: ["confirmed", "cancelled", "draft"],
  confirmed: ["processing", "cancelled", "backordered"],
  processing: ["packed", "cancelled", "backordered"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "partially-delivered", "cancelled"],
  delivered: ["invoiced", "returned"],
  "partially-delivered": ["delivered", "shipped", "backordered"],
  invoiced: ["paid", "partially-paid"],
  paid: ["refunded", "returned"],
  "partially-paid": ["paid", "refunded"],
  backordered: ["processing", "confirmed", "cancelled"],
  cancelled: ["refunded"],
  refunded: [],
  returned: ["refunded"],
};

export interface OrderTransition {
  from: OrderStatus;
  to: OrderStatus;
  timestamp: Date;
  userId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

interface OrderLineItem {
  catalogItemId: string;
  quantity: number;
  deliveredQuantity: number;
  unitPrice: number;
}

export class OrderEngine {
  private history: OrderTransition[] = [];

  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    const allowed = ORDER_STATE_MACHINE[from];
    return allowed?.includes(to) ?? false;
  }

  getAllowedTransitions(from: OrderStatus): OrderStatus[] {
    return ORDER_STATE_MACHINE[from] ?? [];
  }

  transition(params: {
    from: OrderStatus;
    to: OrderStatus;
    userId: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  }): OrderTransition {
    if (!this.canTransition(params.from, params.to)) {
      throw new Error(
        `Invalid order transition: ${params.from} → ${params.to}. ` +
        `Allowed: [${this.getAllowedTransitions(params.from).join(", ")}]`,
      );
    }

    const transition: OrderTransition = {
      from: params.from,
      to: params.to,
      timestamp: new Date(),
      userId: params.userId,
      reason: params.reason,
      metadata: params.metadata,
    };

    this.history.push(transition);
    return transition;
  }

  getHistory(): OrderTransition[] {
    return [...this.history];
  }

  calculatePartialDelivery(params: {
    items: OrderLineItem[];
    deliveredItems: Array<{ catalogItemId: string; quantity: number }>;
  }): {
    fullyDelivered: boolean;
    partiallyDelivered: boolean;
    backordered: boolean;
    remainingItems: Array<{ catalogItemId: string; remainingQuantity: number }>;
  } {
    const remainingItems: Array<{ catalogItemId: string; remainingQuantity: number }> = [];
    let totalFulfilled = 0;
    let totalOrdered = 0;

    for (const item of params.items) {
      const delivered = params.deliveredItems.find(
        (d) => d.catalogItemId === item.catalogItemId,
      );
      const deliveredQty = delivered?.quantity ?? 0;
      totalOrdered += item.quantity;
      totalFulfilled += deliveredQty;

      if (deliveredQty < item.quantity) {
        remainingItems.push({
          catalogItemId: item.catalogItemId,
          remainingQuantity: item.quantity - deliveredQty,
        });
      }
    }

    return {
      fullyDelivered: remainingItems.length === 0,
      partiallyDelivered: remainingItems.length > 0 && totalFulfilled > 0,
      backordered: remainingItems.length > 0 && totalFulfilled === 0,
      remainingItems,
    };
  }

  canFulfillFromStock(item: OrderLineItem, availableStock: number): boolean {
    const remaining = item.quantity - item.deliveredQuantity;
    return availableStock >= remaining;
  }

  getOrderStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      draft: "Draft",
      quotation: "Quotation",
      confirmed: "Confirmed",
      processing: "Processing",
      packed: "Packed",
      shipped: "Shipped",
      delivered: "Delivered",
      "partially-delivered": "Partially Delivered",
      invoiced: "Invoiced",
      paid: "Paid",
      "partially-paid": "Partially Paid",
      backordered: "Backordered",
      cancelled: "Cancelled",
      refunded: "Refunded",
      returned: "Returned",
    };
    return labels[status] ?? status;
  }
}

export const orderEngine = new OrderEngine();
