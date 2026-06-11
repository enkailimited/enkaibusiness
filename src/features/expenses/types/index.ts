export type ExpenseStatus = "draft" | "approved" | "paid";

export interface ExpenseWithRelations {
  id: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  storeId: string | null;
  categoryId: string;
  staffId: string | null;
  amount: number;
  expenseDate: string;
  reference: string | null;
  description: string | null;
  paidTo: string | null;
  receiptUrl: string | null;
  status: ExpenseStatus;
  createdById: string | null;
  approvedById: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
  staff?: { id: string; firstName: string; lastName: string } | null;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
  approvedBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateExpenseInput {
  categoryId: string;
  staffId?: string;
  amount: number;
  expenseDate?: string;
  description?: string;
  paidTo?: string;
  status?: ExpenseStatus;
  branchId?: string;
  storeId?: string;
}

export interface ExpenseFilter {
  categoryId?: string;
  status?: string;
  staffId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
