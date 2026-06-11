export type TransferStatus = "draft" | "dispatched" | "received" | "cancelled";

export interface TransferItemData {
  id: string;
  stockTransferId: string;
  catalogItemId: string;
  variantId: string | null;
  quantity: number;
  receivedQuantity: number;
  catalogItem: {
    id: string;
    name: string;
    sku: string | null;
  };
}

export interface TransferWithItems {
  id: string;
  businessId: string;
  businessToId: string;
  fromLocationId: string;
  toLocationId: string;
  transferDate: Date;
  status: TransferStatus;
  notes: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: TransferItemData[];
}

export interface TransferWithRelations extends TransferWithItems {
  business?: { id: string; name: string };
  businessTo?: { id: string; name: string };
  fromLocation?: { id: string; name: string; type: string };
  toLocation?: { id: string; name: string; type: string };
  createdBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateTransferInput {
  businessId: string;
  businessToId: string;
  fromLocationId: string;
  toLocationId: string;
  transferDate?: Date;
  notes?: string;
  createdById?: string;
  items: Array<{
    catalogItemId: string;
    variantId?: string;
    quantity: number;
  }>;
}

export interface TransferFilter {
  status?: TransferStatus;
  fromLocationId?: string;
  toLocationId?: string;
  startDate?: Date;
  endDate?: Date;
}
