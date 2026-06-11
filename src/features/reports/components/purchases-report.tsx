"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ReportCard, formatCurrency } from "./report-card";
import type { PurchasesReport } from "../types";

interface PurchasesReportViewProps {
  data: PurchasesReport;
}

export function PurchasesReportView({ data }: PurchasesReportViewProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Purchases Report</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <ReportCard label="Total Spend" value={formatCurrency(data.summary.total)} />
        <ReportCard label="Purchase Count" value={String(data.summary.count)} />
        <ReportCard label="Average Purchase" value={formatCurrency(data.summary.avg)} />
        <ReportCard label="Min Purchase" value={formatCurrency(data.summary.min)} />
        <ReportCard label="Max Purchase" value={formatCurrency(data.summary.max)} />
      </div>

      {data.bySupplier.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spend by Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "name", header: "Supplier", cell: (s) => s.supplierName },
                {
                  key: "spend",
                  header: "Total Spend",
                  cell: (s) => formatCurrency(s.totalSpend),
                },
                {
                  key: "count",
                  header: "Purchases",
                  cell: (s) => String(s.purchaseCount),
                },
              ]}
              data={data.bySupplier.map((s) => ({ ...s, id: s.supplierId }))}
              emptyTitle="No supplier data"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
