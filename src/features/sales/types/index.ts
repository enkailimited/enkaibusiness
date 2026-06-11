export type SaleStatus = "draft" | "completed" | "cancelled" | "refunded";

export interface Sale {
  id: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  storeId: string | null;
  customerId: string | null;
  staffId: string | null;
  saleDate: string;
  reference: string | null;
  status: SaleStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  profitMargin: number | null;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  catalogItemId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  costPrice: number | null;
}

export interface SaleItemWithCatalog extends SaleItem {
  catalogItem: {
    id: string;
    name: string;
    sku: string | null;
    price: number;
  };
}

export interface SaleWithItems extends Sale {
  items: SaleItemWithCatalog[];
}

export interface SaleWithRelations extends SaleWithItems {
  customer?: {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
  } | null;
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  _count?: {
    invoices: number;
    returns: number;
  };
}

export interface SaleListItem {
  id: string;
  reference: string | null;
  saleDate: string;
  status: SaleStatus;
  grandTotal: number;
  customer?: {
    id: string;
    firstName: string;
    lastName: string | null;
  } | null;
  _count: { items: number };
}

export interface SaleItemInput {
  catalogItemId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface CreateSaleInput {
  branchId?: string;
  storeId?: string;
  customerId?: string;
  staffId?: string;
  saleDate?: string;
  reference?: string;
  status?: SaleStatus;
  discountTotal?: number;
  taxTotal?: number;
  notes?: string;
  items: SaleItemInput[];
}

export interface SaleFilter {
  branchId?: string;
  storeId?: string;
  customerId?: string;
  staffId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}
