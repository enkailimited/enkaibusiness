"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import {
  Building2,
  Users,
  Settings,
  LayoutDashboard,
  User,
} from "lucide-react";

const workspaceNavItems = [
  { title: "Dashboard", href: "/workspaces/dashboard", icon: LayoutDashboard },
  { title: "Businesses", href: "/workspaces/businesses", icon: Building2 },
  { title: "Members", href: "/workspaces/members", icon: Users },
  { title: "Profile", href: "/workspaces/profile", icon: User },
  { title: "Settings", href: "/workspaces/settings", icon: Settings },
];

export default function WorkspacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      {/* <Sidebar items={workspaceNavItems} /> */}

      <div className="flex flex-1 flex-col transition-all duration-300">
        <Navbar profileHref="/workspaces/profile" />

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="max-w-8xl">{children}</div>
        </main>
      </div>

      {/* <BottomNav items={workspaceNavItems} /> */}
    </div>
  );
}
