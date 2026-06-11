export type CreditAccountStatus = "active" | "frozen" | "closed";
export type CreditTransactionType = "credit_sale" | "payment" | "adjustment" | "write_off" | "refund";

export interface CreditAccount {
  id: string;
  businessId: string;
  customerId: string;
  creditLimit: number;
  currentBalance: number;
  status: CreditAccountStatus;
  lastTransactionAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditAccountWithCustomer extends CreditAccount {
  customer: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
}

export interface CreditAccountWithTransactions extends CreditAccountWithCustomer {
  transactions: CreditTransactionWithDetails[];
}

export interface CreateAccountInput {
  customerId: string;
  creditLimit: number;
}

export interface CreditTransaction {
  id: string;
  accountId: string;
  type: CreditTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string | null;
  description: string | null;
  createdById: string | null;
  createdAt: string;
}

export interface CreditTransactionWithDetails extends CreditTransaction {
  createdBy: {
    id: string;
    firstName: string;
    lastName: string | null;
  } | null;
}

export interface AccountFilter {
  status?: CreditAccountStatus;
  customerId?: string;
}

export interface TransactionFilter {
  type?: CreditTransactionType;
  fromDate?: string;
  toDate?: string;
}
