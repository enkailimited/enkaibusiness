export type InvoiceStatus = "draft" | "issued" | "unpaid" | "partial" | "paid" | "overdue" | "cancelled";

export interface InvoiceItemData {
  id: string;
  invoiceId: string;
  catalogItemId: string | null;
  description: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface InvoiceWithItems {
  id: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  customerId: string;
  saleId: string | null;
  invoiceDate: string;
  dueDate: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItemData[];
}

export interface InvoiceWithRelations extends InvoiceWithItems {
  customer: { id: string; firstName: string; lastName: string | null };
  sale?: { id: string; invoiceNumber?: string } | null;
}

export interface CreateInvoiceInput {
  customerId: string;
  saleId?: string;
  dueDate?: string;
  notes?: string;
  items: Array<{
    catalogItemId?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface InvoiceFilter {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
