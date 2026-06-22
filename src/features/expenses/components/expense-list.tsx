"use client";

import { useQuery } from "@tanstack/react-query";
import { listExpensesAction } from "../actions";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { EXPENSE_STATUS_LABELS } from "../constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExpenseWithRelations } from "../types";

interface ExpenseListProps {
  businessId: string;
}

export function ExpenseList({ businessId }: ExpenseListProps) {
  const query = useQuery({
    queryKey: ["expenses", businessId],
    queryFn: async () => {
      const result = await listExpensesAction(businessId);
      return (result ?? []) as ExpenseWithRelations[];
    },
  });

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

  if (query.isPending) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <DataTable
      columns={columns}
      data={query.data ?? []}
      emptyTitle="No expenses found"
      emptyDescription="Record your first expense to get started."
    />
  );
}
