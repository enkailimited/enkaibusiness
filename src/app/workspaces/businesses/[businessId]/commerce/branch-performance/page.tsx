"use client";

import { use, useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getBranchPerformanceAction } from "@/features/financial/actions";
import { Building2, Award } from "lucide-react";

interface Props { params: Promise<{ businessId: string }> }

function fmt(n: number): string {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(n);
}

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function BranchPerformancePage({ params }: Props) {
  const { businessId } = use(params);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return toDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const data = await getBranchPerformanceAction(businessId, start.toISOString(), end.toISOString());
      setBranches(data);
    } finally {
      setLoading(false);
    }
  }, [businessId, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="space-y-6 p-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /><Skeleton className="h-96 w-full" /></div>;

  const best = branches.length > 0 ? branches.reduce((a, b) => a.operatingProfit > b.operatingProfit ? a : b) : null;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Branch Performance" description="Compare financial performance across branches" />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="from-date" className="text-sm font-medium">From</label>
          <input
            id="from-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="to-date" className="text-sm font-medium">To</label>
          <input
            id="to-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm"
          />
        </div>
      </div>

      {best && (
        <Card className="border-2 border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-center gap-3 py-4">
            <Award className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Best Performing Branch</p>
              <p className="text-lg font-bold text-emerald-900">{best.branchName} — {fmt(best.operatingProfit)} profit</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {branches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No branch data available</p>
        ) : (
          branches.map((branch, idx) => (
            <Card key={branch.branchId} className={idx === 0 ? "border-emerald-200" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{branch.branchName}</CardTitle>
                    {idx === 0 && <Badge variant="success" className="text-xs">#1</Badge>}
                  </div>
                  <span className="text-sm text-muted-foreground">{branch.staffCount} staff</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-lg font-bold">{fmt(branch.revenue)}</p>
                    <p className="text-xs text-muted-foreground">{branch.saleCount} sales</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gross Profit</p>
                    <p className={`text-lg font-bold ${branch.grossProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(branch.grossProfit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Operating Profit</p>
                    <p className={`text-lg font-bold ${branch.operatingProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(branch.operatingProfit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expenses</p>
                    <p className="text-lg font-bold text-red-500">{fmt(branch.expenses)}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 border-t pt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Receivables</p>
                    <p className="text-sm font-semibold text-amber-600">{fmt(branch.receivables)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payables</p>
                    <p className="text-sm font-semibold text-red-600">{fmt(branch.payables)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Inventory</p>
                    <p className="text-sm font-semibold">{fmt(branch.inventoryValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
