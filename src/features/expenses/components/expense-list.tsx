import { requireAuth } from "@/server/auth";
import { listExpenses } from "../services/expense-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { EXPENSE_STATUS_LABELS } from "../constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ExpenseWithRelations } from "../types";

interface ExpenseListProps {
  businessId: string;
}

export async function ExpenseList({ businessId }: ExpenseListProps) {
  await requireAuth();
  const expenses = await listExpenses(businessId);

  const columns = [
    {
      key: "reference",
      header: "Reference",
      cell: (exp: ExpenseWithRelations) => (
        <span className="font-medium">{exp.reference ?? "—"}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (exp: ExpenseWithRelations) => (
        <span>{exp.category.name}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (exp: ExpenseWithRelations) => (
        <span className="font-mono text-sm">{formatCurrency(exp.amount)}</span>
      ),
    },
    {
      key: "expenseDate",
      header: "Date",
      cell: (exp: ExpenseWithRelations) => (
        <span className="text-muted-foreground">{formatDate(exp.expenseDate)}</span>
      ),
    },
    {
      key: "paidTo",
      header: "Paid To",
      cell: (exp: ExpenseWithRelations) => (
        <span className="text-muted-foreground">{exp.paidTo ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (exp: ExpenseWithRelations) => (
        <Badge variant={exp.status === "paid" ? "default" : exp.status === "approved" ? "outline" : "secondary"}>
          {EXPENSE_STATUS_LABELS[exp.status] ?? exp.status}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={expenses}
      emptyTitle="No expenses found"
      emptyDescription="Record your first expense to get started."
    />
  );
}
