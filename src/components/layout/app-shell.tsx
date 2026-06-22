"use client";

import type React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import {
  LayoutDashboard,
  Settings,
  BarChart3,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const platformNavItems: NavItem[] = [
  { title: "Dashboard", href: "/platform/dashboard", icon: LayoutDashboard },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-muted/20">
      {/* <Sidebar items={platformNavItems} /> */}

      <div className="flex flex-1 flex-col transition-all duration-300">
        <Navbar profileHref="/platform/profile" showSearch />

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* <BottomNav items={platformNavItems} /> */}
    </div>
  );
}
