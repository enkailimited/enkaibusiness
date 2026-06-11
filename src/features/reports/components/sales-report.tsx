"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ReportCard, formatCurrency } from "./report-card";
import type { SalesReport, ReportPeriod, DateRange } from "../types";
import { ReportHeader } from "./report-header";
import { useState } from "react";

interface SalesReportViewProps {
  data: SalesReport;
  businessId: string;
}

export function SalesReportView({ data, businessId: _businessId }: SalesReportViewProps) {
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  });

  const statusEntries = Object.entries(data.byStatus);

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Sales Report"
        period={period}
        dateRange={dateRange}
        onPeriodChange={setPeriod}
        onDateRangeChange={setDateRange}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <ReportCard label="Total Revenue" value={formatCurrency(data.summary.total)} />
        <ReportCard label="Total Sales" value={String(data.summary.count)} />
        <ReportCard label="Average Sale" value={formatCurrency(data.summary.avg)} />
        <ReportCard label="Min Sale" value={formatCurrency(data.summary.min)} />
        <ReportCard label="Max Sale" value={formatCurrency(data.summary.max)} />
      </div>

      {data.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "name", header: "Product", cell: (p) => p.productName },
                { key: "sku", header: "SKU", cell: (p) => p.sku ?? "—" },
                {
                  key: "quantity",
                  header: "Qty Sold",
                  cell: (p) => String(p.quantity),
                },
                {
                  key: "revenue",
                  header: "Revenue",
                  cell: (p) => formatCurrency(p.revenue),
                },
              ]}
              data={data.topProducts.map((p) => ({ ...p, id: p.productId }))}
              emptyTitle="No products sold"
            />
          </CardContent>
        </Card>
      )}

      {data.byStaff.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales by Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "name", header: "Staff", cell: (s) => s.staffName },
                {
                  key: "count",
                  header: "Sales",
                  cell: (s) => String(s.saleCount),
                },
                {
                  key: "revenue",
                  header: "Revenue",
                  cell: (s) => formatCurrency(s.totalRevenue),
                },
              ]}
              data={data.byStaff.map((s) => ({ ...s, id: s.staffId }))}
              emptyTitle="No staff sales"
            />
          </CardContent>
        </Card>
      )}

      {statusEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statusEntries.map(([status, count]) => (
                <div key={status} className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground capitalize">{status}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
