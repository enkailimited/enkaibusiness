import "server-only";

export interface BOMItem {
  catalogItemId: string;
  rawMaterialId: string;
  quantity: number;
  unitId: string;
  wastePercent: number;
  unitCost: number;
}

export interface ProductionOrder {
  id?: string;
  productId: string;
  quantity: number;
  bom: BOMItem[];
  status: "planned" | "in-progress" | "completed" | "cancelled";
  batchNo?: string;
  startDate: Date;
  expectedCompletion: Date;
}

export interface BatchRecord {
  batchNo: string;
  catalogItemId: string;
  quantity: number;
  productionDate: Date;
  expiryDate?: Date;
  serialNumbers?: string[];
  qualityStatus: "pending" | "passed" | "failed";
  notes?: string;
}

export class ManufacturingEngine {
  calculateMaterialRequirements(
    productId: string,
    quantity: number,
    bom: BOMItem[],
  ): Array<{
    rawMaterialId: string;
    requiredQuantity: number;
    wasteAdjustedQuantity: number;
  }> {
    return bom.map((item) => {
      const baseRequired = item.quantity * quantity;
      const wasteAdjustment = baseRequired * (1 + item.wastePercent / 100);
      return {
        rawMaterialId: item.rawMaterialId,
        requiredQuantity: baseRequired,
        wasteAdjustedQuantity: wasteAdjustment,
      };
    });
  }

  calculateProductionCost(bom: BOMItem[], quantity: number): {
    materialCost: number;
    totalCost: number;
    unitCost: number;
  } {
    const materialCost = bom.reduce(
      (sum, item) => sum + item.unitCost * item.quantity * quantity,
      0,
    );
    const overhead = materialCost * 0.15;
    const labor = materialCost * 0.1;
    const totalCost = materialCost + overhead + labor;

    return {
      materialCost,
      totalCost,
      unitCost: totalCost / quantity,
    };
  }

  generateBatchNo(productCode: string): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const seq = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");
    return `B-${productCode}-${dateStr}-${seq}`;
  }

  generateSerialNumbers(params: {
    batchNo: string;
    prefix: string;
    count: number;
  }): string[] {
    const serials: string[] = [];
    for (let i = 1; i <= params.count; i++) {
      serials.push(`${params.prefix}-${params.batchNo}-${String(i).padStart(4, "0")}`);
    }
    return serials;
  }

  validateBatch(batch: BatchRecord): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    if (!batch.batchNo) issues.push("Batch number is required");
    if (batch.quantity <= 0) issues.push("Quantity must be positive");
    if (batch.expiryDate && batch.expiryDate <= batch.productionDate) {
      issues.push("Expiry date must be after production date");
    }
    return { valid: issues.length === 0, issues };
  }
}

export const manufacturingEngine = new ManufacturingEngine();
