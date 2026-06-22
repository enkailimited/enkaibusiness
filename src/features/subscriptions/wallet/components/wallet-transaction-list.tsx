"use client";

import { useEffect, useState } from "react";
import { getTransactionsAction } from "../actions";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { WALLET_TRANSACTION_TYPE_LABELS } from "../../constants";
import type { TransactionListItem } from "../types";

interface WalletTransactionListProps {
  businessId: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const transactionVariants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  deposit: "success",
  consumption: "destructive",
  bonus: "default",
  adjustment: "warning",
  refund: "success",
  expiry: "secondary",
};

export function WalletTransactionList({
  businessId,
}: WalletTransactionListProps) {
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransactionsAction(businessId).then((result) => {
      if (result.data) {
        setTransactions(result.data as TransactionListItem[]);
      }
      setLoading(false);
    });
  }, [businessId]);

  const columns = [
    {
      key: "createdAt",
      header: "Date",
      cell: (t: TransactionListItem) => (
        <span className="text-muted-foreground text-xs">
          {formatDate(t.createdAt)}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (t: TransactionListItem) => (
        <Badge variant={transactionVariants[t.type] ?? "secondary"}>
          {WALLET_TRANSACTION_TYPE_LABELS[t.type] ?? t.type}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (t: TransactionListItem) => (
        <span className="font-medium tabular-nums">
          {formatCurrency(t.amount)}
        </span>
      ),
    },
    {
      key: "balanceBefore",
      header: "Before",
      cell: (t: TransactionListItem) => (
        <span className="text-muted-foreground tabular-nums">
          {formatCurrency(t.balanceBefore)}
        </span>
      ),
    },
    {
      key: "balanceAfter",
      header: "After",
      cell: (t: TransactionListItem) => (
        <span className="font-medium tabular-nums">
          {formatCurrency(t.balanceAfter)}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (t: TransactionListItem) => (
        <span className="text-muted-foreground">
          {t.description ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={transactions}
      isLoading={loading}
      emptyTitle="No transactions"
      emptyDescription="Wallet transactions will appear here."
    />
  );
}
