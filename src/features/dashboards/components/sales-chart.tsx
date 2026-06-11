"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SalesChartProps {
  title?: string;
  data: Array<{
    label: string;
    value: number;
    date?: string;
  }>;
}

export function SalesChart({ title = "Sales Trend", data }: SalesChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((point, i) => {
            const pct = (point.value / maxValue) * 100;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 truncate">
                  {point.label}
                </span>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-16 text-right">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "TZS",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(point.value)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
