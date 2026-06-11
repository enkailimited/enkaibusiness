export interface ExpenseCategory {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategoryWithCount extends ExpenseCategory {
  _count: { expenses: number };
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  isActive?: boolean;
}
