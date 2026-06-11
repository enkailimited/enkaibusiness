export type CashRegisterType = "main" | "petty_cash" | "till";

export type CashTransactionType =
  | "cash_in"
  | "cash_out"
  | "transfer_in"
  | "transfer_out"
  | "opening_balance"
  | "closing_balance"
  | "cash_count";

export interface RegisterWithTransactions {
  id: string;
  businessId: string;
  branchId: string | null;
  storeId: string | null;
  name: string;
  type: CashRegisterType;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: { id: string; name: string } | null;
  store?: { id: string; name: string } | null;
}

export interface CashTransactionWithRegister {
  id: string;
  registerId: string;
  type: CashTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string | null;
  description: string | null;
  performedById: string | null;
  createdAt: string;
  performedBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateRegisterInput {
  name: string;
  type: CashRegisterType;
  currency?: string;
  openingBalance?: number;
  branchId?: string;
  storeId?: string;
}

export interface CreateTransactionInput {
  registerId: string;
  type: CashTransactionType;
  amount: number;
  reference?: string;
  description?: string;
  performedById?: string;
}

export interface RegisterFilter {
  type?: string;
  branchId?: string;
  storeId?: string;
  isActive?: boolean;
  search?: string;
}

export interface TransactionFilter {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
