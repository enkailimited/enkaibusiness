export type PurchaseOrderStatus = "draft" | "sent" | "approved" | "received" | "cancelled";

export interface PurchaseOrderWithItems {
  id: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  supplierId: string;
  staffId: string | null;
  orderDate: string;
  expectedDate: string | null;
  status: PurchaseOrderStatus;
  reference: string | null;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItemWithCatalog[];
}

export interface PurchaseOrderItemWithCatalog {
  id: string;
  purchaseOrderId: string;
  catalogItemId: string;
  variantId: string | null;
  quantity: number;
  unitCost: number;
  receivedQuantity: number;
  subtotal: number;
  catalogItem: {
    id: string;
    name: string;
    sku: string | null;
  };
}

export interface PurchaseOrderWithRelations extends PurchaseOrderWithItems {
  supplier: { id: string; name: string };
  staff?: { id: string; firstName: string; lastName: string } | null;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface CreatePurchaseOrderInput {
  branchId?: string;
  supplierId: string;
  staffId?: string;
  orderDate?: string;
  expectedDate?: string;
  status?: PurchaseOrderStatus;
  tax?: number;
  notes?: string;
  items: Array<{
    catalogItemId: string;
    variantId?: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
  }>;
}

export interface PurchaseOrderFilter {
  supplierId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PurchaseOrderListItem {
  id: string;
  orderDate: string;
  expectedDate: string | null;
  status: PurchaseOrderStatus;
  reference: string | null;
  subtotal: number;
  tax: number;
  total: number;
  supplier: { id: string; name: string };
  _count: { items: number };
}
