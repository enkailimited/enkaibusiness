"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Plus, Download, Loader2 } from "lucide-react";
import { getMySalesStats } from "@/server/actions/sales-team";
import { formatCurrency } from "@/lib/utils";
import { LEDGER_STATUS_LABELS, COMMISSION_TYPE_LABELS } from "@/features/commissions/constants";

export default function SalesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMySalesStats();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch sales stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currency = "TSh";

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="My Sales"
        description="Track your sales records and performance."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <p className="text-2xl font-bold">{formatCurrency(data?.today?.amount ?? 0)}</p>
                <p className="text-xs text-muted-foreground">{data?.today?.count ?? 0} entries</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <p className="text-2xl font-bold">{formatCurrency(data?.week?.amount ?? 0)}</p>
                <p className="text-xs text-muted-foreground">{data?.week?.count ?? 0} entries</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <p className="text-2xl font-bold">{formatCurrency(data?.month?.amount ?? 0)}</p>
                <p className="text-xs text-muted-foreground">{data?.month?.count ?? 0} entries</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button className="gap-2" disabled>
          <Plus className="h-4 w-4" />
          Record Sale
        </Button>
        <Button variant="outline" className="gap-2" disabled>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Commission Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !data?.recent?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BarChart3 className="mb-4 h-12 w-12" />
              <p className="text-sm">No sales recorded yet</p>
              <p className="text-xs">Your sales will appear here once you start selling.</p>
            </div>
          ) : (
            <div className="divide-y">
              {data.recent.map((entry: any) => (
                <div key={entry.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {formatCurrency(Number(entry.amount))}
                    </p>
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
