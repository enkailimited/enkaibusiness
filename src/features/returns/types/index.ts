export type ReturnStatus = "draft" | "approved" | "rejected";

export type ReturnCondition = "damaged" | "expired" | "defective" | "change_of_mind";

export interface ReturnItemData {
  id: string;
  returnId: string;
  catalogItemId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  reason: string | null;
  condition: string | null;
}

export interface ReturnWithItems {
  id: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  storeId: string | null;
  saleId: string;
  returnDate: string;
  reference: string | null;
  reason: string;
  status: ReturnStatus;
  refundAmount: number;
  refundMethod: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: ReturnItemData[];
}

export interface ReturnWithRelations extends ReturnWithItems {
  sale: { id: string; invoiceNumber?: string };
}

export interface CreateReturnInput {
  saleId: string;
  storeId?: string;
  branchId?: string;
  reason: string;
  refundAmount: number;
  refundMethod?: string;
  notes?: string;
  items: Array<{
    catalogItemId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    reason?: string;
    condition?: ReturnCondition;
  }>;
}

export interface ReturnFilter {
  status?: string;
  saleId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
