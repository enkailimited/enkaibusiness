"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Loader2, Trophy, Star, Zap, Target, TrendingUp, Users, DollarSign } from "lucide-react";
import { getMyPerformanceMetrics } from "@/server/actions/sales-team";
import { formatCurrency } from "@/lib/utils";

interface Achievement {
  title: string;
  description: string;
  icon: any;
  unlocked: boolean;
  color: string;
  bg: string;
}

export default function AchievementsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyPerformanceMetrics();
      setMetrics(result ?? null);
    } catch (err) {
      console.error("Failed to fetch achievements:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const achievements: Achievement[] = metrics ? [
    {
      title: "First Lead",
      description: "Created your first lead",
      icon: Target,
      unlocked: metrics.totalLeads >= 1,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "First Conversion",
      description: "Converted your first lead to a client",
      icon: Users,
      unlocked: metrics.convertedLeads >= 1,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      title: "Rising Star",
      description: "Achieved 5 lead conversions",
      icon: Star,
      unlocked: metrics.convertedLeads >= 5,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      title: "Top Performer",
      description: "Achieved 10 lead conversions",
      icon: Trophy,
      unlocked: metrics.convertedLeads >= 10,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    {
      title: "Commission Earner",
      description: "Earned your first commission",
      icon: DollarSign,
      unlocked: metrics.totalCommissions > 0,
      color: "text-violet-600",
      bg: "bg-violet-100",
    },
    {
      title: "Momentum",
      description: "Converted 5 leads in a month",
      icon: Zap,
      unlocked: metrics.monthLeads >= 5,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      title: "Consistency",
      description: "Maintained 30%+ conversion rate",
      icon: TrendingUp,
      unlocked: metrics.conversionRate >= 30,
      color: "text-rose-600",
      bg: "bg-rose-100",
    },
    {
      title: "Commission Milestone",
      description: `Earned ${formatCurrency(1000000)} in total commissions`,
      icon: DollarSign,
      unlocked: metrics.totalCommissions >= 1000000,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
  ] : [];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progressPct = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Achievements" description="Your sales milestones and achievements." />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-12">
                <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-muted mb-4" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : achievements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Award className="mb-4 h-12 w-12" />
            <p className="text-sm">No achievements yet</p>
            <p className="text-xs">Start selling to unlock achievements.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{unlockedCount} of {achievements.length} unlocked</p>
                <span className="text-sm text-muted-foreground">{progressPct}%</span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Keep going! More achievements await.</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {achievements.map((a) => (
              <Card key={a.title} className={a.unlocked ? "" : "opacity-50"}>
                <CardContent className="flex flex-col items-center py-6 text-center">
                  <div className={"mb-3 rounded-full p-3 " + (a.unlocked ? a.bg : "bg-muted")}>
                    <a.icon className={"h-6 w-6 " + (a.unlocked ? a.color : "text-muted-foreground")} />
                  </div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                  {a.unlocked && (
                    <Badge variant="default" className="mt-3 text-xs">Unlocked</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
