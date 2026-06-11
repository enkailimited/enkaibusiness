export interface GoodsReceivedItemData {
  id: string;
  goodsReceivedId: string;
  catalogItemId: string;
  variantId: string | null;
  expectedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  catalogItem: {
    id: string;
    name: string;
    sku: string | null;
  };
}

export interface GoodsReceivedWithItems {
  id: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  storeId: string | null;
  purchaseOrderId: string | null;
  staffId: string | null;
  receivedDate: Date;
  reference: string | null;
  notes: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: GoodsReceivedItemData[];
}

export interface GoodsReceivedWithRelations extends GoodsReceivedWithItems {
  purchaseOrder?: {
    id: string;
    reference: string;
    status: string;
  } | null;
  staff?: { id: string; firstName: string; lastName: string } | null;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateGoodsReceivedInput {
  workspaceId: string;
  businessId: string;
  branchId?: string;
  storeId?: string;
  purchaseOrderId?: string;
  staffId?: string;
  receivedDate?: Date;
  reference?: string;
  notes?: string;
  createdById?: string;
  items: Array<{
    catalogItemId: string;
    variantId?: string;
    expectedQuantity: number;
    receivedQuantity: number;
    unitCost: number;
  }>;
}

export interface GoodsReceivedFilter {
  startDate?: Date;
  endDate?: Date;
  purchaseOrderId?: string;
  staffId?: string;
  reference?: string;
}
