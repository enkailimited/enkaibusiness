"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ReportCard, formatCurrency } from "./report-card";
import type { ExpensesReport } from "../types";

interface ExpensesReportViewProps {
  data: ExpensesReport;
}

export function ExpensesReportView({ data }: ExpensesReportViewProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Expenses Report</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <ReportCard label="Total Expenses" value={formatCurrency(data.summary.total)} />
        <ReportCard label="Expense Count" value={String(data.summary.count)} />
        <ReportCard label="Average Expense" value={formatCurrency(data.summary.avg)} />
        <ReportCard label="Min Expense" value={formatCurrency(data.summary.min)} />
        <ReportCard label="Max Expense" value={formatCurrency(data.summary.max)} />
      </div>

      {data.byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "name", header: "Category", cell: (c) => c.categoryName },
                {
                  key: "spend",
                  header: "Total Spend",
                  cell: (c) => formatCurrency(c.totalSpend),
                },
                {
                  key: "count",
                  header: "Expenses",
                  cell: (c) => String(c.expenseCount),
                },
              ]}
              data={data.byCategory.map((c) => ({ ...c, id: c.categoryId }))}
              emptyTitle="No expense categories"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
