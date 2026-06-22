"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileBarChart, Loader2, Download, TrendingUp, Users, DollarSign, Target, BarChart3 } from "lucide-react";
import { getMyPerformanceMetrics, getMyLeadMetrics, getMyMonthlySalesHistory, getMyCommissionMetrics } from "@/server/actions/sales-team";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [leadMetrics, setLeadMetrics] = useState<any>(null);
  const [commissionMetrics, setCommissionMetrics] = useState<any>(null);
  const [monthlyHistory, setMonthlyHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [perf, leads, history, commissions] = await Promise.all([
        getMyPerformanceMetrics(),
        getMyLeadMetrics(),
        getMyMonthlySalesHistory(),
        getMyCommissionMetrics(),
      ]);
      setMetrics(perf ?? null);
      setLeadMetrics(leads ?? null);
      setMonthlyHistory(history ?? []);
      setCommissionMetrics(commissions ?? null);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
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
      <PageHeader title="Reports" description="Sales reports and analytics.">
        <Button variant="outline" className="gap-2" disabled>
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </PageHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-12">
                <div className="h-6 w-32 animate-pulse rounded bg-muted mb-6" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-4 w-full animate-pulse rounded bg-muted" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : metrics ? (
        <>
          {/* Summary Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    Total Leads
                  </div>
                  <p className="text-2xl font-bold">{metrics.totalLeads}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    Conversion Rate
                  </div>
                  <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Target className="h-4 w-4" />
                    Active Clients
                  </div>
                  <p className="text-2xl font-bold">{metrics.activeClients}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    Total Commission
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.totalCommissions)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission Breakdown */}
          {commissionMetrics && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Commission Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Earned</span>
                    <span className="text-sm font-medium">{formatCurrency(commissionMetrics.totalEarned)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600">Approved</span>
                    <span className="text-sm font-medium">{formatCurrency(commissionMetrics.totalApproved)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-600">Paid</span>
                    <span className="text-sm font-medium">{formatCurrency(commissionMetrics.totalPaid)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-amber-600">Pending</span>
                    <span className="text-sm font-medium">{formatCurrency(commissionMetrics.totalPending)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Lead Status Summary */}
              {leadMetrics && leadMetrics.statusCounts && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Lead Status Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total</span>
                      <span className="text-sm font-medium">{leadMetrics.totalLeads}</span>
                    </div>
                    {leadMetrics.statusCounts.map((s: any) => (
                      <div key={s.status} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{s.status}</span>
                        <span className="text-sm font-medium">{s.count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Monthly Trend */}
          {monthlyHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyHistory.map((m: any) => (
                    <div key={m.month} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{m.month}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">{m.count} entries</span>
                          <span className="font-medium">{formatCurrency(m.amount)}</span>
                        </div>
                      </div>
                      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                          style={{ width: maxMonthlyAmount > 0 ? `${(m.amount / maxMonthlyAmount) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Year to Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Year to Date</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Commission Earned</span>
                    <span className="text-sm font-medium">{formatCurrency(metrics.yearCommissions)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Average</span>
                    <span className="text-sm font-medium">
                      {monthlyHistory.length > 0
                        ? formatCurrency(metrics.yearCommissions / monthlyHistory.length)
                        : formatCurrency(0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">This Month Leads</span>
                  <span className="text-sm font-medium">{metrics.monthLeads}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">This Month Commission</span>
                  <span className="text-sm font-medium">{formatCurrency(metrics.monthCommissions)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Conversion Rate</span>
                  <span className="text-sm font-medium">{metrics.conversionRate}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 className="mb-4 h-12 w-12" />
            <p className="text-sm">No report data available</p>
            <p className="text-xs">Reports will populate as you generate sales data.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
