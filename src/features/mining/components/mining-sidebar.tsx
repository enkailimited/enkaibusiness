"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "", icon: "LayoutDashboard" },
  { label: "Sites", href: "/sites", icon: "Map" },
  { label: "Licenses", href: "/licenses", icon: "FileText" },
  { label: "Equipment", href: "/equipment", icon: "Wrench" },
  { label: "Fuel", href: "/fuel", icon: "Fuel" },
  { label: "Inventory", href: "/inventory", icon: "Package" },
  { label: "Sales", href: "/sales", icon: "TrendingUp" },
  { label: "Expenses", href: "/expenses", icon: "DollarSign" },
  { label: "Reports", href: "/reports", icon: "BarChart3" },
];

interface MiningSidebarProps {
  businessId: string;
  businessName: string;
}

export function MiningSidebar({ businessId, businessName }: MiningSidebarProps) {
  const pathname = usePathname();
  const basePath = `/workspaces/businesses/${businessId}/mining`;

  return (
    <aside className="w-56 border-r bg-muted/30 flex flex-col shrink-0">
      <div className="p-3 border-b">
        <p className="text-xs text-muted-foreground">Mining</p>
        <p className="font-semibold truncate text-sm">{businessName}</p>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-auto">
        {navItems.map((item) => {
          const href = item.href ? `${basePath}${item.href}` : basePath;
          const isActive = pathname === href || (item.href && pathname.startsWith(href));
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
