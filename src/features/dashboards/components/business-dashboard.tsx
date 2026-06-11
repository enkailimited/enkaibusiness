"use client";

import { useState, useEffect } from "react";
import type { RoleDashboard, KPIData } from "../types";
import { KPIGrid } from "./kpi-grid";
import { SalesChart } from "./sales-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";

interface BusinessDashboardProps {
  businessId: string;
  initialData?: RoleDashboard;
}

export function BusinessDashboard({
  businessId,
  initialData,
}: BusinessDashboardProps) {
  const [dashboard, setDashboard] = useState<RoleDashboard | null>(
    initialData ?? null,
  );
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) return;

    async function load() {
      try {
        const res = await fetch(`/api/dashboard/business/${businessId}`);
        const data = await res.json();
        setDashboard(data);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [businessId, initialData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <KPIGrid kpis={[]} isLoading />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Failed to load dashboard
        </CardContent>
      </Card>
    );
  }

  const kpiWidget = dashboard.layout.widgets.find((w) => w.type === "kpi");
  const chartWidget = dashboard.layout.widgets.find(
    (w) => w.type === "sales-chart",
  );
  const productsWidget = dashboard.layout.widgets.find(
    (w) => w.type === "top-products",
  );

  const chartData =
    chartWidget?.data && typeof chartWidget.data === "object" && "recentSales" in chartWidget.data
      ? (chartWidget.data as { recentSales: Array<{ id: string; reference: string | null; grandTotal: number; saleDate: string; customer?: { firstName: string; lastName: string | null } | null }> })
      : { recentSales: [] };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Business Dashboard</h2>

      {kpiWidget && (
        <KPIGrid
          kpis={kpiWidget.data as KPIData[]}
          layout={dashboard.layout}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SalesChart
          title={chartWidget?.title ?? "Sales Trend"}
          data={chartData.recentSales.map((s) => ({
            label: s.reference ?? new Date(s.saleDate).toLocaleDateString(),
            value: s.grandTotal,
            date: s.saleDate,
          }))}
        />

        {productsWidget && (
          <Card>
            <CardHeader>
              <CardTitle>{productsWidget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    key: "name",
                    header: "Product",
                    cell: (p: Record<string, unknown>) =>
                      String(p.name ?? "Unknown"),
                  },
                  {
                    key: "qty",
                    header: "Sold",
                    cell: (p: Record<string, unknown>) =>
                      String(p.quantity ?? 0),
                  },
                  {
                    key: "revenue",
                    header: "Revenue",
                    cell: (p: Record<string, unknown>) =>
                      new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "TZS",
                        minimumFractionDigits: 0,
                      }).format(Number(p.revenue) || 0),
                  },
                ]}
                data={(productsWidget.data as Array<Record<string, unknown>>).map(
                  (d, i) => ({ ...d, id: String(i) }),
                ) as Array<{ id: string } & Record<string, unknown>>}
                emptyTitle="No product data"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {chartData.recentSales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  key: "ref",
                  header: "Reference",
                  cell: (s: Record<string, unknown>) =>
                    String(s.reference ?? "—"),
                },
                {
                  key: "customer",
                  header: "Customer",
                  cell: (s: Record<string, unknown>) => {
                    const c = s.customer as {
                      firstName?: string;
                      lastName?: string | null;
                    } | null;
                    return c
                      ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()
                      : "Walk-in";
                  },
                },
                {
                  key: "total",
                  header: "Total",
                  cell: (s: Record<string, unknown>) =>
                    new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "TZS",
                      minimumFractionDigits: 0,
                    }).format(Number(s.grandTotal) || 0),
                },
              ]}
              data={chartData.recentSales as Array<{ id: string } & Record<string, unknown>>}
              emptyTitle="No recent sales"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
