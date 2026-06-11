"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TRANSACTION_TYPE_LABELS, DEFAULT_PAGE_SIZE } from "../constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CreditTransactionWithDetails } from "../types";

interface TransactionListProps {
  accountId: string;
  initialPage?: number;
}

export function TransactionList({ accountId, initialPage = 1 }: TransactionListProps) {
  const [transactions, setTransactions] = useState<CreditTransactionWithDetails[]>([]);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getTransactionsAction } = await import("../actions");
      const result = await getTransactionsAction(accountId, undefined, page, DEFAULT_PAGE_SIZE);
      setTransactions(result.data);
      setTotalPages(result.totalPages);
    } catch {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [accountId, page]);

  useEffect(() => {
    load();
  }, [load]);

  const typeVariant = (type: string) => {
    switch (type) {
      case "credit_sale": return "default";
      case "payment": return "success";
      case "adjustment": return "warning";
      case "write_off": return "destructive";
      case "refund": return "secondary";
      default: return "outline";
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading transactions...</div>;
  }

  if (transactions.length === 0) {
    return <div className="text-sm text-muted-foreground py-4 text-center">No transactions found.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Balance</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">By</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(tx.createdAt)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Badge variant={typeVariant(tx.type)}>
                    {TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-right whitespace-nowrap">
                  <span className={tx.amount >= 0 ? "text-green-600" : "text-red-600"}>
                    {tx.amount >= 0 ? "+" : ""}{formatCurrency(tx.amount)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-right whitespace-nowrap">
                  {formatCurrency(tx.balanceAfter)}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                  {tx.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                  {tx.createdBy
                    ? `${tx.createdBy.firstName}${tx.createdBy.lastName ? ` ${tx.createdBy.lastName}` : ""}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
