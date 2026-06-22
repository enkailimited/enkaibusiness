"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlatformStatsAction } from "@/server/actions/platform";
import { AreaChart, TrendingUp, Users, DollarSign, CreditCard, Headphones } from "lucide-react";

export default function PlatformOverviewPage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformStatsAction()
      .then((data) => setStats(data as unknown as Record<string, number>))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Total Workspaces", value: stats?.totalWorkspaces ?? 0, icon: AreaChart, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Total Businesses", value: stats?.totalBusinesses ?? 0, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Active Businesses", value: stats?.activeBusinesses ?? 0, icon: TrendingUp, color: "text-cyan-600", bg: "bg-cyan-100" },
    { title: "Total Sales", value: stats?.totalSales ? `TSh ${(stats.totalSales).toLocaleString()}` : "TSh 0", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "30d Signups", value: stats?.recentSignups ?? 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Active Subscriptions", value: stats?.activeSubscriptions ?? 0, icon: CreditCard, color: "text-rose-600", bg: "bg-rose-100" },
    { title: "Open Tickets", value: stats?.pendingSupportTickets ?? 0, icon: Headphones, color: "text-orange-600", bg: "bg-orange-100" },
  ];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Platform Overview"
        description="Platform-wide performance overview and insights."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={stat.bg + " p-2 rounded-lg " + stat.color}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">{stat.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Analytics chart coming soon
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Analytics chart coming soon
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
