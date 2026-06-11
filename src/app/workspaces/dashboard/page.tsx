"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickActionCard } from "@/components/ui/quick-action-card";
import { Building2, Users, GitBranch, Settings } from "lucide-react";

import { getWorkspaceDashboardAction } from "@/features/dashboards/actions";

const actions = [
  { title: "Businesses", href: "/workspaces/businesses", icon: Building2, color: "text-blue-600", bg: "bg-blue-100" },
  { title: "Members", href: "/workspaces/members", icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
  { title: "Settings", href: "/workspaces/settings", icon: Settings, color: "text-slate-600", bg: "bg-slate-100" },
];

export default function WorkspaceDashboardPage() {
  const [data, setData] = useState<{ businesses: number; members: number; branches: number; workspaceName: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkspaceDashboardAction()
      .then((d) => setData(d as any))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Businesses", value: data?.businesses ?? 0, icon: Building2 },
    { label: "Members", value: data?.members ?? 0, icon: Users },
    { label: "Active Branches", value: data?.branches ?? 0, icon: GitBranch },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title={loading ? "Workspace" : (data?.workspaceName ?? "Workspace")}
        description="Overview of your workspace activity"
      />

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">
          Quick Access
        </h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {actions.map((a) => (
            <QuickActionCard key={a.href} {...a} />
          ))}
        </div>
      </div>
    </div>
  );
}
