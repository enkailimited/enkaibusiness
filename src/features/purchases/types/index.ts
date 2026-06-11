export type PurchaseStatus = "draft" | "completed" | "cancelled";

export interface PurchaseWithItems {
  id: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  storeId: string | null;
  supplierId: string;
  staffId: string | null;
  purchaseDate: string;
  reference: string | null;
  status: PurchaseStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseItemWithCatalog[];
}

export interface PurchaseItemWithCatalog {
  id: string;
  purchaseId: string;
  catalogItemId: string;
  variantId: string | null;
  quantity: number;
  unitCost: number;
  subtotal: number;
  catalogItem: {
    id: string;
    name: string;
    sku: string | null;
  };
}

export interface PurchaseWithRelations extends PurchaseWithItems {
  supplier: { id: string; name: string };
  staff?: { id: string; firstName: string; lastName: string } | null;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface CreatePurchaseInput {
  branchId?: string;
  storeId?: string;
  supplierId: string;
  staffId?: string;
  purchaseDate?: string;
  reference?: string;
  status?: PurchaseStatus;
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

export interface PurchaseFilter {
  supplierId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PurchaseListItem {
  id: string;
  reference: string | null;
  purchaseDate: string;
  status: PurchaseStatus;
  subtotal: number;
  tax: number;
  total: number;
  supplier: { id: string; name: string };
  _count: { items: number };
}
