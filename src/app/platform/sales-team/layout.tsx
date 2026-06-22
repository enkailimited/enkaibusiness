"use client";

import { useMemo } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  LayoutDashboard,
  BarChart3,
  PhoneCall,
  Target,
  DollarSign,
  Users,
  FileBarChart,
  MapPin,
  TrendingUp,
  ShoppingBag,
  Award,
  UserPlus,
} from "lucide-react";

export default function SalesTeamLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const canManageTeam = user?.roles?.some((r) =>
    ["national-sales-manager", "national-manager", "regional-manager", "team-leader"].includes(r)
  ) ?? false;

  const salesNavItems = useMemo(() => [
    { title: "Dashboard", href: "/platform/sales-team", icon: LayoutDashboard },
    { title: "My Sales", href: "/platform/sales-team/sales", icon: BarChart3 },
    ...(canManageTeam ? [{ title: "My Team", href: "/platform/sales-team/team", icon: UserPlus }] : []),
    { title: "Leads", href: "/platform/sales-team/leads", icon: PhoneCall },
    { title: "Targets", href: "/platform/sales-team/targets", icon: Target },
    { title: "Commissions", href: "/platform/sales-team/commissions", icon: DollarSign },
    { title: "Clients", href: "/platform/sales-team/clients", icon: Users },
    { title: "Reports", href: "/platform/sales-team/reports", icon: FileBarChart },
    { title: "Territories", href: "/platform/sales-team/territories", icon: MapPin },
    { title: "Performance", href: "/platform/sales-team/performance", icon: TrendingUp },
    { title: "Orders", href: "/platform/sales-team/orders", icon: ShoppingBag },
    { title: "Achievements", href: "/platform/sales-team/achievements", icon: Award },
  ], [canManageTeam]);

  return (
    <div className="min-h-screen bg-muted/20">
      {/* <Sidebar items={salesNavItems} /> */}

      <div className="flex flex-1 flex-col transition-all duration-300">
        <Navbar profileHref="/platform/profile" showSearch />

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* <BottomNav items={salesNavItems} /> */}
    </div>
  );
}
