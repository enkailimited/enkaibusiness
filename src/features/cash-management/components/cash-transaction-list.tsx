import { requireAuth } from "@/server/auth";
import { getRegisterTransactions } from "../services/cash-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_VARIANTS, DEFAULT_PAGE_SIZE } from "../constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CashTransactionWithRegister } from "../types";

interface CashTransactionListProps {
  registerId: string;
  page?: number;
}

export async function CashTransactionList({ registerId, page = 1 }: CashTransactionListProps) {
  await requireAuth();
  const result = await getRegisterTransactions(registerId, { page, limit: DEFAULT_PAGE_SIZE });

  const columns = [
    {
      key: "createdAt",
      header: "Date",
      cell: (tx: CashTransactionWithRegister) => (
        <span className="text-muted-foreground">{formatDate(tx.createdAt)}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (tx: CashTransactionWithRegister) => (
        <Badge variant={TRANSACTION_TYPE_VARIANTS[tx.type] ?? "secondary"}>
          {TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (tx: CashTransactionWithRegister) => {
        const isInflow = tx.type === "cash_in" || tx.type === "transfer_in";
        return (
          <span className={`font-mono text-sm ${isInflow ? "text-green-600" : "text-red-600"}`}>
            {isInflow ? "+" : "-"}{formatCurrency(tx.amount)}
          </span>
        );
      },
    },
    {
      key: "balanceBefore",
      header: "Balance Before",
      cell: (tx: CashTransactionWithRegister) => (
        <span className="font-mono text-sm text-muted-foreground">{formatCurrency(tx.balanceBefore)}</span>
      ),
    },
    {
      key: "balanceAfter",
      header: "Balance After",
      cell: (tx: CashTransactionWithRegister) => (
        <span className="font-mono text-sm">{formatCurrency(tx.balanceAfter)}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (tx: CashTransactionWithRegister) => (
        <span className="text-muted-foreground">{tx.description ?? "—"}</span>
      ),
    },
    {
      key: "performedBy",
      header: "Performed By",
      cell: (tx: CashTransactionWithRegister) => (
        <span className="text-muted-foreground">
          {tx.performedBy ? `${tx.performedBy.firstName} ${tx.performedBy.lastName}` : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={result.data}
        emptyTitle="No transactions found"
        emptyDescription="Record your first cash transaction."
      />
      {result.totalPages > 1 && (
        <p className="text-sm text-muted-foreground text-center">
          Page {page} of {result.totalPages} ({result.total} total)
        </p>
      )}
    </div>
  );
}
