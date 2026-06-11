"use client";

import type { KPIData, DashboardLayout } from "../types";
import { KPICard } from "./kpi-card";

interface KPIGridProps {
  kpis: KPIData[];
  layout?: DashboardLayout;
  isLoading?: boolean;
}

export function KPIGrid({ kpis, layout, isLoading }: KPIGridProps) {
  if (isLoading) {
    const columns = layout?.columns ?? 3;
    return (
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-8 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const columns = layout?.columns ?? 3;

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {kpis.map((kpi, index) => (
        <KPICard key={`${kpi.label}-${index}`} data={kpi} />
      ))}
    </div>
  );
}
