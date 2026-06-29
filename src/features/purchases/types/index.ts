export type PurchaseStatus = "draft" | "completed" | "unpaid" | "partial" | "paid" | "overdue" | "cancelled";

export function computePurchaseStatus(total: number, paidAmount: number, dueDate: string | null): PurchaseStatus {
  const paid = Number(paidAmount);
  const t = Number(total);
  const balance = t - paid;

  if (paid === 0 && balance === t) return "unpaid";
  if (paid > 0 && balance > 0) return "partial";
  if (balance <= 0) return "paid";
  if (dueDate && new Date(dueDate) < new Date() && balance > 0) return "overdue";
  return "unpaid";
}

export function validatePurchaseBalance(total: number, paidAmount: number, balanceDue: number): boolean {
  return Math.abs(Number(paidAmount) + Number(balanceDue) - Number(total)) < 0.001;
}

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
  paidAmount: number;
  balanceDue: number;
  dueDate: string | null;
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
  paidAmount?: number;
  dueDate?: string;
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
  paidAmount: number;
  balanceDue: number;
  subtotal: number;
  tax: number;
  total: number;
  supplier: { id: string; name: string };
  _count: { items: number };
}
