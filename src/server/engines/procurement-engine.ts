import "server-only";

import type { ProcurementStatus } from "./types";

const PROCUREMENT_STATE_MACHINE: Record<ProcurementStatus, ProcurementStatus[]> = {
  draft: ["requested", "cancelled"],
  requested: ["rfq-sent", "approved", "cancelled"],
  "rfq-sent": ["quotation-received", "cancelled"],
  "quotation-received": ["approved", "rfq-sent", "cancelled"],
  approved: ["ordered", "cancelled"],
  ordered: ["partially-received", "fully-received", "cancelled"],
  "partially-received": ["fully-received", "ordered", "cancelled"],
  "fully-received": ["invoiced", "cancelled"],
  invoiced: ["paid", "cancelled"],
  paid: [],
  cancelled: [],
};

const APPROVAL_THRESHOLDS = [
  { maxAmount: 500000, requiredLevel: 1 },
  { maxAmount: 5000000, requiredLevel: 2 },
  { maxAmount: 50000000, requiredLevel: 3 },
  { maxAmount: Infinity, requiredLevel: 4 },
];

export interface PurchaseRequest {
  id?: string;
  requestedBy: string;
  department: string;
  items: Array<{ catalogItemId: string; quantity: number; estimatedUnitCost: number }>;
  totalEstimated: number;
  priority: "low" | "medium" | "high" | "urgent";
  notes?: string;
}

export interface SupplierQuote {
  supplierId: string;
  items: Array<{ catalogItemId: string; unitPrice: number; deliveryDays: number }>;
  totalCost: number;
  validUntil: Date;
  notes?: string;
}

export class ProcurementEngine {
  canTransition(from: ProcurementStatus, to: ProcurementStatus): boolean {
    return PROCUREMENT_STATE_MACHINE[from]?.includes(to) ?? false;
  }

  getAllowedTransitions(from: ProcurementStatus): ProcurementStatus[] {
    return PROCUREMENT_STATE_MACHINE[from] ?? [];
  }

  getRequiredApprovalLevel(totalAmount: number): number {
    for (const threshold of APPROVAL_THRESHOLDS) {
      if (totalAmount <= threshold.maxAmount) return threshold.requiredLevel;
    }
    return 4;
  }

  needsApproval(totalAmount: number): boolean {
    return totalAmount > 500000;
  }

  compareQuotes(quotes: SupplierQuote[]): {
    bestQuote: SupplierQuote;
    savings: number;
    comparisons: Array<{ supplierId: string; totalCost: number; difference: number }>;
  } {
    const sorted = [...quotes].sort((a, b) => a.totalCost - b.totalCost);
    const best = sorted[0];
    const average = quotes.reduce((s, q) => s + q.totalCost, 0) / quotes.length;

    return {
      bestQuote: best,
      savings: average - best.totalCost,
      comparisons: sorted.map((q) => ({
        supplierId: q.supplierId,
        totalCost: q.totalCost,
        difference: q.totalCost - best.totalCost,
      })),
    };
  }

  calculateDeliveryVariance(params: {
    expectedItems: Array<{ catalogItemId: string; quantity: number }>;
    receivedItems: Array<{ catalogItemId: string; quantity: number; condition: "good" | "damaged" | "expired" }>;
  }): Array<{
    catalogItemId: string;
    expectedQuantity: number;
    receivedQuantity: number;
    variance: number;
    condition: string;
  }> {
    return params.expectedItems.map((expected) => {
      const received = params.receivedItems.find((r) => r.catalogItemId === expected.catalogItemId);
      const receivedQty = received?.quantity ?? 0;
      return {
        catalogItemId: expected.catalogItemId,
        expectedQuantity: expected.quantity,
        receivedQuantity: receivedQty,
        variance: receivedQty - expected.quantity,
        condition: received?.condition ?? "missing",
      };
    });
  }
}

export const procurementEngine = new ProcurementEngine();
