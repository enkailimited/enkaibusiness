import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Building2, Users, Settings, LayoutDashboard } from "lucide-react";

const workspaceNavItems = [
  { title: "Dashboard", href: "/workspaces/dashboard", icon: LayoutDashboard },
  { title: "Businesses", href: "/workspaces/businesses", icon: Building2 },
  { title: "Members", href: "/workspaces/members", icon: Users },
  { title: "Settings", href: "/workspaces/settings", icon: Settings },
];

export default function WorkspacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar items={workspaceNavItems} title="My Workspace" />
      <main className="pb-16 md:pl-64 md:pb-0">
        <div className="container py-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
