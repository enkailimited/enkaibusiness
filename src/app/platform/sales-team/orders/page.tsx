"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Loader2, CreditCard, Calendar, Building2 } from "lucide-react";
import { getMyCommissionEntries } from "@/server/actions/sales-team";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function OrdersPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyCommissionEntries();
      setEntries(result ?? []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const paidEntries = entries.filter((e) => e.status === "PAID" || e.status === "APPROVED");
  const totalOrderValue = paidEntries.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Orders" description="Subscription orders from your clients." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <p className="text-2xl font-bold">{paidEntries.length}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(totalOrderValue)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <p className="text-2xl font-bold">{entries.filter((e) => e.status === "PENDING").length}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commission Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingBag className="mb-4 h-12 w-12" />
              <p className="text-sm">No orders yet</p>
              <p className="text-xs">Subscription orders from your converted leads will appear here.</p>
            </div>
          ) : (
            <div className="divide-y">
              {entries.map((entry: any) => (
                <div key={entry.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{formatCurrency(Number(entry.amount))}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.description ?? "Commission entry"}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </div>
                  <Badge variant={entry.status === "PAID" ? "default" : entry.status === "APPROVED" ? "outline" : entry.status === "PENDING" ? "secondary" : "destructive"}>
                    {entry.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
