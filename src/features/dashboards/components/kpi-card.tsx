"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KPIData } from "../types";

interface KPICardProps {
  data: KPIData;
}

function formatValue(value: string | number): string {
  if (typeof value === "number") {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return new Intl.NumberFormat("en-US").format(value);
  }
  return value;
}

export function KPICard({ data }: KPICardProps) {
  const trendIcon = data.trend === "up" ? "↑" : data.trend === "down" ? "↓" : "→";
  const trendColor =
    data.trend === "up"
      ? "text-green-600"
      : data.trend === "down"
        ? "text-red-600"
        : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">
          {data.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold">{formatValue(data.value)}</p>
          {data.change !== null && (
            <span className={`text-sm ${trendColor}`}>
              {trendIcon} {Math.abs(data.change).toFixed(1)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
