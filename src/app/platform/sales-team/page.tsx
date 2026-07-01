"use client";

import { PageHeader } from "@/components/layout/page-header";
import { QuickActionCard } from "@/components/ui/quick-action-card";
import { useAuth } from "@/features/auth/components/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3, Target, Users, DollarSign, FileBarChart,
  MapPin, TrendingUp, PhoneCall, ShoppingBag, Award, UserPlus,
} from "lucide-react";

const SALES_ROLES = [
  "national-sales-manager",
  "national-manager",
  "regional-manager",
  "team-leader",
  "freelancer",
];

const MANAGER_ROLES = new Set([
  "national-sales-manager",
  "national-manager",
  "regional-manager",
  "team-leader",
]);

const baseActions = [
  { title: "My Team", href: "/platform/sales-team/team", icon: Users, managerOnly: true },
  { title: "Register Customer", href: "/platform/sales-team/register", icon: UserPlus },
  { title: "My Sales", href: "/platform/sales-team/sales", icon: BarChart3 },
  { title: "Targets", href: "/platform/sales-team/targets", icon: Target },
  { title: "Clients", href: "/platform/sales-team/clients", icon: Users },
  { title: "Commissions", href: "/platform/sales-team/commissions", icon: DollarSign },
  { title: "Reports", href: "/platform/sales-team/reports", icon: FileBarChart },
  { title: "Territories", href: "/platform/sales-team/territories", icon: MapPin },
  { title: "Performance", href: "/platform/sales-team/performance", icon: TrendingUp },
  { title: "Leads", href: "/platform/sales-team/leads", icon: PhoneCall },
  { title: "Orders", href: "/platform/sales-team/orders", icon: ShoppingBag },
  { title: "Achievements", href: "/platform/sales-team/achievements", icon: Award },
];

export default function SalesTeamDashboard() {
  const { user } = useAuth();

  const isSalesTeam = user?.roles?.some((r) => SALES_ROLES.includes(r)) ?? false;
  const isManager = user?.roles?.some((r) => MANAGER_ROLES.has(r)) ?? false;
  const salesActions = baseActions.filter((a) => !a.managerOnly || isManager);

  if (!isSalesTeam) {
    return (
      <div className="space-y-6 pb-10">
        <PageHeader title="Sales Team" description="Your sales operations and performance hub." showBackButton={false} />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            You do not have a sales team role assigned. Contact your administrator.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Sales Team"
        description="Your sales operations and performance hub."
        showBackButton={false}
      />

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
            />
          ))}
        </div>
      </div>
    </div>
  );
}
