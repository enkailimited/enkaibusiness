"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Loader2, TrendingUp, Users, DollarSign } from "lucide-react";
import { getMyPerformanceMetrics, getMyTargetsAction } from "@/server/actions/sales-team";
import { formatCurrency } from "@/lib/utils";

export default function TargetsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [targetsData, setTargetsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [result, targets] = await Promise.all([
        getMyPerformanceMetrics(),
        getMyTargetsAction(),
      ]);
      setMetrics(result ?? null);
      setTargetsData(targets ?? null);
    } catch (err) {
      console.error("Failed to fetch targets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const targets = metrics && targetsData ? [
    {
      title: "Monthly Leads",
      current: metrics.monthLeads,
      target: targetsData.monthlyLeads,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Conversion Rate",
      current: `${metrics.conversionRate}%`,
      target: `${targetsData.conversionRate}%`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      title: "Monthly Commission",
      current: formatCurrency(metrics.monthCommissions),
      target: formatCurrency(targetsData.monthlyCommission),
      icon: DollarSign,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      title: "Yearly Commission",
      current: formatCurrency(metrics.yearCommissions),
      target: formatCurrency(targetsData.yearlyCommission),
      icon: Target,
      color: "text-violet-600",
      bg: "bg-violet-100",
    },
  ] : [];

  function getProgress(current: number | string, target: number | string): number {
    const c = typeof current === "string" ? parseFloat(current.replace(/[^0-9.]/g, "")) : current;
    const t = typeof target === "string" ? parseFloat(target.replace(/[^0-9.]/g, "")) : target;
    if (t === 0) return 0;
    return Math.min(100, Math.round((c / t) * 100));
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Targets" description="Track your sales targets and progress." />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-8">
                <div className="h-8 w-32 animate-pulse rounded bg-muted mb-4" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !metrics ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Target className="mb-4 h-12 w-12" />
            <p className="text-sm">No target data available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {targets.map((t) => {
            const progress = getProgress(t.current, t.target);
            return (
              <Card key={t.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t.title}</CardTitle>
                  <div className={"p-2 rounded-lg " + t.bg}>
                    <t.icon className={"h-4 w-4 " + t.color} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-bold">{t.current}</p>
                    <p className="text-sm text-muted-foreground">target: {t.target}</p>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{progress}% complete</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
