"use client";

import { PageHeader } from "@/components/layout/page-header";
import { QuickActionCard } from "@/components/ui/quick-action-card";
import { useHasAnyPermission } from "@/hooks/use-permission";
import {
  BarChart3, Users, UserPlus, Megaphone, Headphones,
  CreditCard, DollarSign, QrCode, Wallet, ShieldCheck, AreaChart,
} from "lucide-react";

const actionGroups = [
  {
    title: "Overview",
    actions: [
      { title: "Overview", href: "/platform/overview", icon: AreaChart, color: "text-emerald-600", bg: "bg-emerald-100", permission: "reports.read" },
    ],
  },
  {
    title: "Sales & Distribution",
    actions: [
      { title: "Sales", href: "/platform/sales", icon: BarChart3, color: "text-blue-600", bg: "bg-blue-100", permission: "sales.read" },
      { title: "Commissions", href: "/platform/commissions", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100", permission: "sales.read" },
      { title: "Distribution", href: "/platform/distribution", icon: QrCode, color: "text-orange-600", bg: "bg-orange-100", permission: "purchases.read" },
    ],
  },
  {
    title: "Growth & CRM",
    actions: [
      { title: "Leads", href: "/platform/leads", icon: Users, color: "text-indigo-600", bg: "bg-indigo-100", permission: "workspaces.read" },
      { title: "Onboarding", href: "/platform/onboarding", icon: UserPlus, color: "text-purple-600", bg: "bg-purple-100", permission: "workspaces.manage_members" },
      { title: "Marketing", href: "/platform/marketing", icon: Megaphone, color: "text-pink-600", bg: "bg-pink-100", permission: "workspaces.read" },
    ],
  },
  {
    title: "Finance & Billing",
    actions: [
      { title: "Finance", href: "/platform/finance", icon: Wallet, color: "text-amber-600", bg: "bg-amber-100", permission: "expenses.read" },
      { title: "Subscriptions", href: "/platform/subscriptions", icon: CreditCard, color: "text-cyan-600", bg: "bg-cyan-100", permission: "businesses.read" },
    ],
  },
  {
    title: "Administration",
    actions: [
      { title: "Users", href: "/platform/users", icon: Users, color: "text-slate-600", bg: "bg-slate-100", permission: "users.read" },
      { title: "Roles", href: "/platform/roles", icon: ShieldCheck, color: "text-red-600", bg: "bg-red-100", permission: "roles.read" },
      { title: "Support", href: "/platform/support", icon: Headphones, color: "text-violet-600", bg: "bg-violet-100", permission: "users.read" },
    ],
  },
];

function DashboardActions() {
  const allPermissions = actionGroups.flatMap((g) => g.actions.map((a) => a.permission));
  const permMap = Object.fromEntries(
    allPermissions.map((p) => [p, useHasAnyPermission([p])]),
  );

  return (
    <div className="space-y-8">
      {actionGroups.map((group) => (
        <div key={group.title} className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70 px-1">
            {group.title}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {group.actions.map((action) => (
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
      ))}
    </div>
  );
}

export function PlatformDashboardContent() {
  return (
    <div className="space-y-10 pb-10">
      <PageHeader
        title="Platform Dashboard"
        description="Quick access to platform modules and operations."
        showBackButton={false}
      />

      <DashboardActions />
    </div>
  );
}
