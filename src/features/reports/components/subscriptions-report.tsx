"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ReportCard, formatCurrency } from "./report-card";
import type { SubscriptionsReport } from "../types";

interface SubscriptionsReportViewProps {
  data: SubscriptionsReport;
}

export function SubscriptionsReportView({ data }: SubscriptionsReportViewProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Subscriptions Report</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportCard label="Active Subscribers" value={String(data.summary.totalActive)} />
        <ReportCard label="MRR" value={formatCurrency(data.summary.mrr)} />
        <ReportCard label="ARPU" value={formatCurrency(data.summary.arpu)} />
        <ReportCard label="Total Revenue" value={formatCurrency(data.summary.totalRevenue)} />
        <ReportCard
          label="Churn Rate"
          value={`${(data.churnRate * 100).toFixed(2)}%`}
        />
      </div>

      {data.planDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "plan", header: "Plan", cell: (p) => p.planName },
                {
                  key: "subs",
                  header: "Subscribers",
                  cell: (p) => String(p.subscriberCount),
                },
                {
                  key: "mrr",
                  header: "MRR",
                  cell: (p) => formatCurrency(p.mrr),
                },
              ]}
              data={data.planDistribution.map((p) => ({ ...p, id: p.planId }))}
              emptyTitle="No plan data"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
