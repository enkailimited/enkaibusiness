import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { getDashboardData } from "@/features/financial/services/financial-service";
import {
  TrendingUp as ArrowUp, TrendingDown as ArrowDown,
  Package, AlertTriangle,
} from "lucide-react";

interface Props { params: Promise<{ businessId: string }> }

function fmt(n: number): string {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS", minimumFractionDigits: 0 }).format(n);
}

async function FinancialOverview({ businessId }: { businessId: string }) {
  await requireAuth();

  const [business, dashboard] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, slug: true },
    }),
    getDashboardData(businessId).catch(() => null),
  ]);

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
        <p className="text-sm font-semibold">Business not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Financial Overview" description={`${business.name} · ${business.slug}`} />

      {dashboard ? (
        <>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Financial KPIs</h3>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Today&apos;s Sales</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-emerald-600">{fmt(dashboard.todaySales)}</p>
                  <p className="text-xs text-muted-foreground">{dashboard.todaySalesCount} transaction(s)</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Monthly Sales</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">{fmt(dashboard.monthlySales)}</p>
                  <p className="text-xs text-muted-foreground">{dashboard.monthlySalesCount} transaction(s)</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Gross Profit</CardTitle></CardHeader>
                <CardContent>
                  <p className={`text-xl font-bold ${dashboard.grossProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(dashboard.grossProfit)}</p>
                  <p className="text-xs text-muted-foreground">Net: {fmt(dashboard.netProfit)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Cash Position</CardTitle></CardHeader>
                <CardContent>
                  <p className={`text-xl font-bold ${dashboard.cashPosition >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(dashboard.cashPosition)}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Receivables</CardTitle>
                <ArrowUp className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent><p className="text-lg font-bold text-amber-600">{fmt(dashboard.receivablesTotal)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Payables</CardTitle>
                <ArrowDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent><p className="text-lg font-bold text-red-600">{fmt(dashboard.payablesTotal)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Inventory Value</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">{fmt(dashboard.inventoryValue)}</p>
                {dashboard.lowStockCount > 0 && (
                  <Badge variant="destructive" className="mt-1 text-xs">{dashboard.lowStockCount} low stock</Badge>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Low Stock Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <p className={`text-lg font-bold ${dashboard.lowStockCount > 0 ? "text-orange-600" : "text-green-600"}`}>{dashboard.lowStockCount}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Top Products (Month)</CardTitle></CardHeader>
              <CardContent>
                {dashboard.topProducts.length === 0 ? <p className="text-xs text-muted-foreground">No sales this month</p> : (
                  <div className="space-y-2">
                    {dashboard.topProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate text-xs">{p.name}</span>
                        <span className="text-xs font-semibold">{p.revenue.toLocaleString()} TZS</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Top Customers (Month)</CardTitle></CardHeader>
              <CardContent>
                {dashboard.topCustomers.length === 0 ? <p className="text-xs text-muted-foreground">No customer payments this month</p> : (
                  <div className="space-y-2">
                    {dashboard.topCustomers.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate text-xs">{c.name}</span>
                        <span className="text-xs font-semibold">{c.total.toLocaleString()} TZS</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Top Suppliers (Balance)</CardTitle></CardHeader>
              <CardContent>
                {dashboard.topSuppliers.length === 0 ? <p className="text-xs text-muted-foreground">No outstanding supplier balances</p> : (
                  <div className="space-y-2">
                    {dashboard.topSuppliers.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate text-xs">{s.name}</span>
                        <span className="text-xs font-semibold">{s.total.toLocaleString()} TZS</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
          <p className="text-sm text-muted-foreground">No financial data available yet</p>
        </div>
      )}
    </div>
  );
}

export default async function OverviewPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-24 w-full rounded-xl" />))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      }
    >
      <FinancialOverview businessId={businessId} />
    </Suspense>
  );
}
