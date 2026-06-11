"use client";

import { Card } from "@/components/ui/card";
import type { DateRange, ReportPeriod } from "../types";
import { PERIODS } from "../constants";

interface ReportHeaderProps {
  period: ReportPeriod;
  dateRange: DateRange;
  onPeriodChange: (period: ReportPeriod) => void;
  onDateRangeChange: (range: DateRange) => void;
  title?: string;
}

export function ReportHeader({
  period,
  dateRange,
  onPeriodChange,
  onDateRangeChange,
  title,
}: ReportHeaderProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {title && (
          <h2 className="text-lg font-semibold whitespace-nowrap">{title}</h2>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as ReportPeriod)}
            className="h-9 rounded-md border px-3 text-sm"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">From:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  onDateRangeChange({ ...dateRange, startDate: e.target.value })
                }
                className="h-9 rounded-md border px-2 text-sm"
              />
              <label className="text-sm text-muted-foreground">To:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  onDateRangeChange({ ...dateRange, endDate: e.target.value })
                }
                className="h-9 rounded-md border px-2 text-sm"
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
