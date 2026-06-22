"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Loader2, Users, Target, DollarSign, PhoneCall, BarChart3 } from "lucide-react";
import { getMyPerformanceMetrics, getMyLeadMetrics, getMyMonthlySalesHistory } from "@/server/actions/sales-team";
import { formatCurrency } from "@/lib/utils";

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [leadMetrics, setLeadMetrics] = useState<any>(null);
  const [monthlyHistory, setMonthlyHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [perf, leads, history] = await Promise.all([
        getMyPerformanceMetrics(),
        getMyLeadMetrics(),
        getMyMonthlySalesHistory(),
      ]);
      setMetrics(perf ?? null);
      setLeadMetrics(leads ?? null);
      setMonthlyHistory(history ?? []);
    } catch (err) {
      console.error("Failed to fetch performance:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxMonthlyAmount = monthlyHistory.length > 0
    ? Math.max(...monthlyHistory.map((m: any) => m.amount))
    : 0;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Performance" description="Your sales performance metrics." />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-8">
                <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : metrics ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
                <PhoneCall className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{metrics.totalLeads}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
                <Users className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{metrics.convertedLeads}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-violet-600" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Commission</CardTitle>
                <DollarSign className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalCommissions)}</p>
              </CardContent>
            </Card>
          </div>

          {monthlyHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Commission Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyHistory.map((m: any) => (
                    <div key={m.month} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{m.month}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(m.amount)}
                        </span>
                      </div>
                      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                          style={{ width: maxMonthlyAmount > 0 ? `${(m.amount / maxMonthlyAmount) * 100}%` : "0%" }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{m.count} entries</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {leadMetrics && leadMetrics.statusCounts && leadMetrics.statusCounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {leadMetrics.statusCounts.map((s: any) => {
                    const pct = leadMetrics.totalLeads > 0
                      ? Math.round((s.count / leadMetrics.totalLeads) * 100)
                      : 0;
                    return (
                      <div key={s.status} className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.status}</p>
                        <p className="text-lg font-bold">{s.count}</p>
                        <p className="text-xs text-muted-foreground">{pct}% of total</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 className="mb-4 h-12 w-12" />
            <p className="text-sm">No performance data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
