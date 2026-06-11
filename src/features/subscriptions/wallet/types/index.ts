import type { SubscriptionWallet, SubscriptionTransaction } from "@prisma/client";

export type WalletTransactionType =
  | "deposit"
  | "consumption"
  | "bonus"
  | "adjustment"
  | "refund"
  | "expiry";

export interface WalletWithTransactions extends SubscriptionWallet {
  transactions: SubscriptionTransaction[];
}

export interface WalletWithBusiness extends SubscriptionWallet {
  business: { id: string; name: string };
}

export interface CreateWalletTransaction {
  type: WalletTransactionType;
  amount: number;
  reference?: string;
  description?: string;
  expiresAt?: Date;
}

export interface TransactionListItem {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string | null;
  description: string | null;
  createdAt: Date;
}

export interface WalletInfo {
  id: string;
  businessId: string;
  balance: number;
  totalDeposited: number;
  totalConsumed: number;
  bonusBalance: number;
  recentTransactions: TransactionListItem[];
}
