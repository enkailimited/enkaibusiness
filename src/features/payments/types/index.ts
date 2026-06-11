export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type PaymentMethodType = "cash" | "card" | "mobile" | "bank" | "credit";

export type PaymentReferenceType =
  | "sale"
  | "invoice"
  | "credit"
  | "subscription"
  | "purchase"
  | "expense";

export interface PaymentMethodWithCount {
  id: string;
  businessId: string;
  name: string;
  type: PaymentMethodType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: { payments: number };
}

export interface PaymentWithRelations {
  id: string;
  businessId: string;
  workspaceId: string | null;
  branchId: string | null;
  storeId: string | null;
  paymentMethodId: string | null;
  customerId: string | null;
  amount: number;
  reference: string | null;
  paidAt: Date;
  status: PaymentStatus;
  notes: string | null;
  saleId: string | null;
  invoiceId: string | null;
  customerCreditTxId: string | null;
  subscriptionId: string | null;
  purchaseId: string | null;
  expenseId: string | null;
  createdById: string | null;
  createdAt: Date;
  paymentMethod?: { id: string; name: string; type: string } | null;
  customer?: { id: string; firstName: string; lastName: string } | null;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface CreatePaymentInput {
  businessId: string;
  workspaceId?: string;
  branchId?: string;
  storeId?: string;
  paymentMethodId?: string;
  customerId?: string;
  amount: number;
  reference?: string;
  paidAt?: Date;
  status?: PaymentStatus;
  notes?: string;
  saleId?: string;
  invoiceId?: string;
  customerCreditTxId?: string;
  subscriptionId?: string;
  purchaseId?: string;
  expenseId?: string;
  createdById?: string;
}

export interface PaymentFilter {
  businessId: string;
  branchId?: string;
  storeId?: string;
  paymentMethodId?: string;
  status?: PaymentStatus;
  referenceType?: PaymentReferenceType;
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
}

export interface CreatePaymentMethodInput {
  businessId: string;
  name: string;
  type: PaymentMethodType;
}
