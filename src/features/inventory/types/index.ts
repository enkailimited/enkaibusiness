export type LocationType = "business" | "branch" | "store";

export interface LocationWithBalances {
  id: string;
  businessId: string;
  branchId: string | null;
  storeId: string | null;
  name: string;
  type: LocationType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  branch?: { id: string; name: string } | null;
  store?: { id: string; name: string } | null;
  balances?: BalanceWithItem[];
  _count?: { balances: number };
}

export interface CreateLocationInput {
  businessId: string;
  branchId?: string;
  storeId?: string;
  name: string;
}

export interface UpdateLocationInput {
  name?: string;
  isActive?: boolean;
}

export interface BalanceWithItem {
  id: string;
  locationId: string;
  catalogItemId: string;
  variantId: string | null;
  quantityOnHand: number;
  quantityAvailable: number;
  quantityCommitted: number;
  reorderPoint: number;
  maxStock: number;
  batchNo: string | null;
  expiryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  catalogItem: {
    id: string;
    name: string;
    sku: string | null;
    category?: { id: string; name: string } | null;
  };
}

export interface BalanceUpdate {
  quantityOnHand?: number;
  quantityAvailable?: number;
  quantityCommitted?: number;
  reorderPoint?: number;
  maxStock?: number;
  batchNo?: string;
  expiryDate?: Date;
}

export interface TransferStockInput {
  fromLocationId: string;
  toLocationId: string;
  catalogItemId: string;
  variantId?: string;
  quantity: number;
  notes?: string;
  createdById?: string;
}
