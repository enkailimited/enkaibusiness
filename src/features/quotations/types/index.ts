export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted";

export interface Quotation {
  id: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  customerId: string | null;
  staffId: string | null;
  quoteDate: string;
  expiryDate: string | null;
  status: QuotationStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  catalogItemId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface QuotationItemWithCatalog extends QuotationItem {
  catalogItem: {
    id: string;
    name: string;
    sku: string | null;
  };
}

export interface QuotationWithItems extends Quotation {
  items: QuotationItemWithCatalog[];
}

export interface QuotationWithRelations extends QuotationWithItems {
  customer?: {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
  } | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface QuotationListItem {
  id: string;
  quoteDate: string;
  expiryDate: string | null;
  status: QuotationStatus;
  subtotal: number;
  tax: number;
  total: number;
  customer?: {
    id: string;
    firstName: string;
    lastName: string | null;
  } | null;
  _count: { items: number };
}

export interface QuotationItemInput {
  catalogItemId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface CreateQuotationInput {
  branchId?: string;
  customerId?: string;
  staffId?: string;
  quoteDate?: string;
  expiryDate?: string;
  status?: QuotationStatus;
  tax?: number;
  notes?: string;
  items: QuotationItemInput[];
}

export interface QuotationFilter {
  customerId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}
