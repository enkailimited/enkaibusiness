export type AdjustmentStatus = "draft" | "approved";

export interface AdjustmentItemData {
  id: string;
  stockAdjustmentId: string;
  catalogItemId: string;
  variantId: string | null;
  expectedQty: number;
  actualQty: number;
  difference: number;
  reason: string | null;
  catalogItem: {
    id: string;
    name: string;
    sku: string | null;
  };
}

export interface AdjustmentWithItems {
  id: string;
  businessId: string;
  locationId: string;
  adjustmentDate: Date;
  reason: string;
  status: AdjustmentStatus;
  notes: string | null;
  approvedById: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: AdjustmentItemData[];
}

export interface AdjustmentWithRelations extends AdjustmentWithItems {
  approvedBy?: { id: string; firstName: string; lastName: string } | null;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
  location?: { id: string; name: string; type: string } | null;
}

export interface CreateAdjustmentInput {
  businessId: string;
  locationId: string;
  adjustmentDate?: Date;
  reason: string;
  notes?: string;
  createdById?: string;
  items: Array<{
    catalogItemId: string;
    variantId?: string;
    expectedQty: number;
    actualQty: number;
    reason?: string;
  }>;
}

export interface AdjustmentFilter {
  status?: AdjustmentStatus;
  locationId?: string;
  startDate?: Date;
  endDate?: Date;
}
