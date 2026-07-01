"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProfitLossAction, getCashFlowAction } from "@/features/financial/actions";
import { TrendingUp, TrendingDown, DollarSign, Receipt } from "lucide-react";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(n);
}

export function ProfitLossReportView({ businessId }: { businessId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  useEffect(() => {
    setLoading(true);
    const now = new Date();
    let start: Date;
    if (period === "monthly") start = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === "quarterly") start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    else start = new Date(now.getFullYear(), 0, 1);

    getProfitLossAction(businessId, start.toISOString(), now.toISOString())
      .then(setData)
      .finally(() => setLoading(false));
  }, [businessId, period]);

  if (loading) return <div className="space-y-4"><div className="h-24 animate-pulse rounded-xl bg-muted" /><div className="h-48 animate-pulse rounded-xl bg-muted" /></div>;
  if (!data) return <p className="text-sm text-muted-foreground">No data available</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["monthly", "quarterly", "yearly"] as const).map((p) => (
          <Button key={p} variant={period === p ? "default" : "outline"} size="sm" onClick={() => setPeriod(p)} className="text-xs">{p}</Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Revenue</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-emerald-600">{fmt(data.revenue)}</p>
            <p className="text-xs text-muted-foreground">{data.saleCount} sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">COGS</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-orange-600">{fmt(data.cogs)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Gross Profit</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${data.grossProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(data.grossProfit)}</p>
            <p className="text-xs text-muted-foreground">Margin: {data.grossMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Operating Expenses</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-red-600">{fmt(data.operatingExpenses)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Profit Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm">Revenue</span>
              <span className="text-sm font-semibold text-emerald-600">+{fmt(data.revenue)}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm">Cost of Goods Sold</span>
              <span className="text-sm font-semibold text-orange-600">-{fmt(data.cogs)}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium">Gross Profit</span>
              <span className={`text-sm font-bold ${data.grossProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(data.grossProfit)}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm">Operating Expenses</span>
              <span className="text-sm font-semibold text-red-600">-{fmt(data.operatingExpenses)}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-base font-bold">Net Profit</span>
              <span className={`text-base font-bold ${data.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(data.netProfit)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CashFlowReportView({ businessId }: { businessId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  useEffect(() => {
    setLoading(true);
    const now = new Date();
    let start: Date;
    if (period === "monthly") start = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === "quarterly") start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    else start = new Date(now.getFullYear(), 0, 1);

    getCashFlowAction(businessId, start.toISOString(), now.toISOString())
      .then(setData)
      .finally(() => setLoading(false));
  }, [businessId, period]);

  if (loading) return <div className="space-y-4"><div className="h-24 animate-pulse rounded-xl bg-muted" /><div className="h-48 animate-pulse rounded-xl bg-muted" /></div>;
  if (!data) return <p className="text-sm text-muted-foreground">No data available</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["monthly", "quarterly", "yearly"] as const).map((p) => (
          <Button key={p} variant={period === p ? "default" : "outline"} size="sm" onClick={() => setPeriod(p)} className="text-xs">{p}</Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Opening Balance</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{fmt(data.openingBalance)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total Inflows</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-emerald-600">+{fmt(data.inflows.totalInflows)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total Outflows</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-red-600">-{fmt(data.outflows.totalOutflows)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Closing Balance</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${data.closingBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(data.closingBalance)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Inflows</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Cash Sales & Collections</span>
              <span className="text-sm font-semibold text-emerald-600">+{fmt(data.inflows.cashSales)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Outflows</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Supplier Payments</span>
              <span className="text-sm font-semibold text-red-600">-{fmt(data.outflows.supplierPayments)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Expenses</span>
              <span className="text-sm font-semibold text-red-600">-{fmt(data.outflows.expenses)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Refunds</span>
              <span className="text-sm font-semibold text-red-600">-{fmt(data.outflows.refunds)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
