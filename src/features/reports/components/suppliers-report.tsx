"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ReportCard, formatCurrency } from "./report-card";
import type { SuppliersReport } from "../types";

interface SuppliersReportViewProps {
  data: SuppliersReport;
}

export function SuppliersReportView({ data }: SuppliersReportViewProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Suppliers Report</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <ReportCard label="Total Suppliers" value={String(data.summary.totalSuppliers)} />
        <ReportCard label="Local" value={String(data.summary.localSuppliers)} />
        <ReportCard label="International" value={String(data.summary.internationalSuppliers)} />
      </div>

      {data.topSuppliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Suppliers by Spend</CardTitle>
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
              data={data.topSuppliers.map((s) => ({ ...s, id: s.supplierId }))}
              emptyTitle="No supplier data"
            />
          </CardContent>
        </Card>
      )}

      {data.reliability.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Supplier Reliability</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "name", header: "Supplier", cell: (s) => s.supplierName },
                {
                  key: "rate",
                  header: "On-Time Rate",
                  cell: (s) => `${(s.onTimeRate * 100).toFixed(1)}%`,
                },
                {
                  key: "orders",
                  header: "Total Orders",
                  cell: (s) => String(s.totalOrders),
                },
              ]}
              data={data.reliability.map((s) => ({ ...s, id: s.supplierId }))}
              emptyTitle="No reliability data"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
