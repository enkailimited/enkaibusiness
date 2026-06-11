"use client";

import { useState, useEffect } from "react";
import type { RoleDashboard, KPIData } from "../types";
import { KPIGrid } from "./kpi-grid";
import { SalesChart } from "./sales-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlatformDashboardProps {
  initialData?: RoleDashboard;
}

export function PlatformDashboard({ initialData }: PlatformDashboardProps) {
  const [dashboard, setDashboard] = useState<RoleDashboard | null>(
    initialData ?? null,
  );
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) return;

    async function load() {
      try {
        const res = await fetch("/api/dashboard/platform");
        const data = await res.json();
        setDashboard(data);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [initialData]);

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
  const subscriptionWidget = dashboard.layout.widgets.find(
    (w) => w.type === "subscriptions",
  );
  const revenueWidget = dashboard.layout.widgets.find(
    (w) => w.type === "revenue-summary",
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Platform Dashboard</h2>

      {kpiWidget && (
        <KPIGrid
          kpis={kpiWidget.data as KPIData[]}
          layout={dashboard.layout}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subscriptionWidget && (
          <Card>
            <CardHeader>
              <CardTitle>{subscriptionWidget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {(subscriptionWidget.data as { count?: number }).count ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Active subscriptions</p>
            </CardContent>
          </Card>
        )}

        {revenueWidget && (
          <Card>
            <CardHeader>
              <CardTitle>{revenueWidget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "TZS",
                  minimumFractionDigits: 0,
                }).format(
                  (revenueWidget.data as { total?: number }).total ?? 0,
                )}
              </p>
              <p className="text-sm text-muted-foreground">Total platform revenue</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
