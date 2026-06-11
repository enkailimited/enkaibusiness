"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ReportCard, formatCurrency } from "./report-card";
import type { CustomersReport } from "../types";

interface CustomersReportViewProps {
  data: CustomersReport;
}

export function CustomersReportView({ data }: CustomersReportViewProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Customers Report</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <ReportCard label="Total Customers" value={String(data.summary.totalCustomers)} />
        <ReportCard label="New Customers" value={String(data.summary.newCustomers)} />
        <ReportCard label="Active Customers" value={String(data.summary.activeCustomers)} />
      </div>

      {data.topCustomers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "name", header: "Customer", cell: (c) => c.customerName },
                {
                  key: "spend",
                  header: "Total Spend",
                  cell: (c) => formatCurrency(c.totalSpend),
                },
                {
                  key: "count",
                  header: "Purchases",
                  cell: (c) => String(c.saleCount),
                },
                {
                  key: "last",
                  header: "Last Purchase",
                  cell: (c) =>
                    c.lastPurchase
                      ? new Date(c.lastPurchase).toLocaleDateString("en-US")
                      : "—",
                },
              ]}
              data={data.topCustomers.map((c) => ({ ...c, id: c.customerId }))}
              emptyTitle="No customer data"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
