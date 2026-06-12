"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getProactiveInsightsAction } from "../actions/service-actions";

interface ProactiveInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  actionLabel?: string;
  actionLink?: string;
}

interface Props {
  businessId: string;
}

export function FirdausInsights({ businessId }: Props) {
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const results = await getProactiveInsightsAction(businessId);
        setInsights(results as ProactiveInsight[]);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [businessId]);

  if (loading || insights.length === 0 || error) return null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">✦</span>
        <h3 className="font-semibold text-sm">Firdaus — Maarifa ya Biashara</h3>
      </div>
      <div className="space-y-2">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`rounded-lg border p-3 text-sm ${
              insight.severity === "high"
                ? "border-red-200 bg-red-50"
                : insight.severity === "medium"
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-blue-200 bg-blue-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                  {insight.title}
                </p>
                <p className="mt-1">{insight.description}</p>
              </div>
              {insight.severity === "high" && (
                <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-medium text-white">
                  Muhimu
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
