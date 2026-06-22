"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Loader2, TrendingUp, Wallet, Clock } from "lucide-react";
import { getMyCommissionEntries, getMyCommissionMetrics } from "@/server/actions/sales-team";
import { formatCurrency } from "@/lib/utils";
import { LEDGER_STATUS_LABELS, COMMISSION_TYPE_LABELS } from "@/features/commissions/constants";

export default function CommissionsPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesData, metricsData] = await Promise.all([
        getMyCommissionEntries(),
        getMyCommissionMetrics(),
      ]);
      setEntries(entriesData ?? []);
      setMetrics(metricsData ?? null);
    } catch (err) {
      console.error("Failed to fetch commissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const metricCards = metrics ? [
    { label: "Total Earned", value: formatCurrency(metrics.totalEarned), icon: DollarSign, color: "text-emerald-600" },
    { label: "Approved", value: formatCurrency(metrics.totalApproved), icon: TrendingUp, color: "text-blue-600" },
    { label: "Paid Out", value: formatCurrency(metrics.totalPaid), icon: Wallet, color: "text-violet-600" },
    { label: "Pending", value: formatCurrency(metrics.totalPending), icon: Clock, color: "text-amber-600" },
  ] : [];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Commissions" description="Track your commission earnings." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6">
                <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))
        ) : (
          metricCards.map((m) => (
            <Card key={m.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{m.label}</CardTitle>
                <m.icon className={"h-4 w-4 " + m.color} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{m.value}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commission History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <DollarSign className="mb-4 h-12 w-12" />
              <p className="text-sm">No commission entries yet</p>
              <p className="text-xs">Your commissions will appear here once you start earning.</p>
            </div>
          ) : (
            <div className="divide-y">
              {entries.map((entry: any) => (
                <div key={entry.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{formatCurrency(Number(entry.amount))}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.description ?? COMMISSION_TYPE_LABELS[entry.type] ?? entry.type}
                    </p>
                  </div>
                  <Badge variant={entry.status === "PAID" ? "default" : entry.status === "APPROVED" ? "outline" : entry.status === "PENDING" ? "secondary" : "destructive"}>
                    {LEDGER_STATUS_LABELS[entry.status] ?? entry.status}
                  </Badge>
                  <div className="text-xs text-muted-foreground w-24 text-right hidden sm:block">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
