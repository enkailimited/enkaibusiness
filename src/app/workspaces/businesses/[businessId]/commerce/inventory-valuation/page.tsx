"use client";

import { use, useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getInventoryValuationAction, getInventoryValuationSummaryAction } from "@/features/financial/actions";
import { Package, Search } from "lucide-react";

interface Props { params: Promise<{ businessId: string }> }

function fmt(n: number): string {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(n);
}

export default function InventoryValuationPage({ params }: Props) {
  const { businessId } = use(params);
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [it, sm] = await Promise.all([
        getInventoryValuationAction(businessId),
        getInventoryValuationSummaryAction(businessId),
      ]);
      setItems(it);
      setSummary(sm);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = items.filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.sku && i.sku.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="space-y-6 p-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Inventory Valuation" description="Financial value of current stock by item" />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total Inventory Value</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(summary?.totalValue ?? 0)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total Items</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary?.totalItems ?? 0}</p></CardContent>
        </Card>
      </div>

      {summary?.byCategory && summary.byCategory.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">By Category</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.byCategory.map((cat: any) => (
                <div key={cat.categoryName} className="flex items-center justify-between">
                  <span className="text-sm">{cat.categoryName} <span className="text-xs text-muted-foreground">({cat.itemCount} items)</span></span>
                  <span className="text-sm font-semibold">{fmt(cat.totalValue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">All Items</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <input
                type="text" placeholder="Search items..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-muted pl-9 pr-3 text-sm outline-none focus:border-blue-300"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium">SKU</th>
                    <th className="pb-2 font-medium">Location</th>
                    <th className="pb-2 font-medium text-right">Qty</th>
                    <th className="pb-2 font-medium text-right">Unit Cost</th>
                    <th className="pb-2 font-medium text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.catalogItemId + item.locationName} className="border-b text-sm">
                      <td className="py-2 font-medium">{item.name}</td>
                      <td className="py-2 text-xs text-muted-foreground">{item.sku ?? "—"}</td>
                      <td className="py-2 text-xs text-muted-foreground">{item.locationName}</td>
                      <td className="py-2 text-right">{item.quantityOnHand}</td>
                      <td className="py-2 text-right">{fmt(item.unitCost)}</td>
                      <td className="py-2 text-right font-semibold">{fmt(item.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
