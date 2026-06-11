"use client";

import { PageHeader } from "@/components/layout/page-header";
import { QuickActionCard } from "@/components/ui/quick-action-card";
import { useHasAnyPermission } from "@/hooks/use-permission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3, Target, Users, DollarSign, FileBarChart,
  MapPin, TrendingUp, PhoneCall, ShoppingBag, Award,
} from "lucide-react";

const salesActions = [
  { title: "My Sales", href: "/platform/sales-team/sales", icon: BarChart3, color: "text-blue-600", bg: "bg-blue-100", permission: "sales.read" },
  { title: "Targets", href: "/platform/sales-team/targets", icon: Target, color: "text-emerald-600", bg: "bg-emerald-100", permission: "sales.read" },
  { title: "Clients", href: "/platform/sales-team/clients", icon: Users, color: "text-indigo-600", bg: "bg-indigo-100", permission: "users.read" },
  { title: "Commissions", href: "/platform/sales-team/commissions", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-100", permission: "sales.read" },
  { title: "Reports", href: "/platform/sales-team/reports", icon: FileBarChart, color: "text-purple-600", bg: "bg-purple-100", permission: "reports.read" },
  { title: "Territories", href: "/platform/sales-team/territories", icon: MapPin, color: "text-orange-600", bg: "bg-orange-100", permission: "sales.read" },
  { title: "Performance", href: "/platform/sales-team/performance", icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-100", permission: "reports.read" },
  { title: "Leads", href: "/platform/sales-team/leads", icon: PhoneCall, color: "text-cyan-600", bg: "bg-cyan-100", permission: "workspaces.read" },
  { title: "Orders", href: "/platform/sales-team/orders", icon: ShoppingBag, color: "text-violet-600", bg: "bg-violet-100", permission: "sales.read" },
  { title: "Achievements", href: "/platform/sales-team/achievements", icon: Award, color: "text-yellow-600", bg: "bg-yellow-100", permission: "sales.read" },
];

const stats = [
  { title: "Today's Sales", value: "TSh 0", icon: BarChart3, color: "text-blue-600" },
  { title: "Monthly Target", value: "0%", icon: Target, color: "text-emerald-600" },
  { title: "Active Clients", value: "0", icon: Users, color: "text-indigo-600" },
  { title: "Commission Earned", value: "TSh 0", icon: DollarSign, color: "text-amber-600" },
];

export default function SalesTeamDashboard() {
  const allPerms = salesActions.map((a) => a.permission);
  const permMap = Object.fromEntries(
    allPerms.map((p) => [p, useHasAnyPermission([p])]),
  );

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Sales Team"
        description="Your sales operations and performance hub."
        showBackButton={false}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={"p-2 rounded-lg bg-muted " + stat.color}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70 px-1">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {salesActions.map((action) => (
            <QuickActionCard
              key={action.href}
              title={action.title}
              href={action.href}
              icon={action.icon}
              color={action.color}
              bg={action.bg}
              requiredPermission={action.permission}
              hasPermission={permMap[action.permission]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
