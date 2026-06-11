export type ReferenceType = "sale" | "purchase" | "adjustment" | "transfer" | "return" | "initial";

export interface MovementWithDetails {
  id: string;
  locationId: string;
  catalogItemId: string;
  variantId: string | null;
  quantityChange: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string | null;
  referenceType: ReferenceType;
  notes: string | null;
  createdById: string | null;
  createdAt: Date;
  location: { id: string; name: string; type: string };
  catalogItem: { id: string; name: string; sku: string | null };
  createdBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateMovementInput {
  locationId: string;
  catalogItemId: string;
  variantId?: string;
  quantityChange: number;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  referenceType: ReferenceType;
  notes?: string;
  createdById?: string;
}

export interface MovementFilter {
  locationId?: string;
  catalogItemId?: string;
  referenceType?: ReferenceType;
  reference?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface InventorySummary {
  totalItems: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalLocations: number;
}
