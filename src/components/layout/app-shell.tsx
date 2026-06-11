"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Logo } from "@/components/ui/logo";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/components/auth-provider";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/features/users/components/user-avatar";
import {
  LayoutDashboard,
  Settings,
  Bell,
  User,
  Search,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  ChevronDown,
  Users,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const platformNavItems: NavItem[] = [
  { title: "Dashboard", href: "/platform/dashboard", icon: LayoutDashboard },
  { title: "Settings", href: "/platform/settings", icon: Settings },
];

const bottomNavItems: NavItem[] = [
  { title: "Dashboard", href: "/platform/dashboard", icon: LayoutDashboard },
  { title: "Settings", href: "/platform/settings", icon: Settings },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : "User";

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className={cn("flex h-16 items-center border-b", collapsed ? "justify-center px-2" : "px-5")}>
          <Logo variant="blue" width={24} height={24} />
          {!collapsed && (
            <span className="ml-3 text-base font-bold tracking-tight">Enkai</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {platformNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
                {!collapsed && item.badge && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* Collapse toggle (desktop only) */}
        <div className="p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden w-full items-center justify-center rounded-xl p-2 text-muted-foreground hover:bg-muted md:flex"
          >
            <ChevronLeft
              className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
            />
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          collapsed ? "md:pl-16" : "md:pl-64",
        )}
      >
        {/* Navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-8">
          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border bg-background"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <Logo variant="blue" width={22} height={22} />
            <span className="font-bold text-sm">Enkai</span>
          </div>

          {/* Desktop: search */}
          <div className="hidden md:flex flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-full rounded-full border bg-muted/40 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 rounded-full border bg-muted/30 px-2 py-1 hover:bg-muted transition-colors focus:outline-none">
                  <UserAvatar
                    firstName={user?.firstName || "U"}
                    lastName={user?.lastName || "S"}
                    avatarUrl={user?.avatarUrl ?? null}
                    className="h-7 w-7"
                  />
                  <span className="hidden text-sm font-medium md:block max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 min-w-[220px] overflow-hidden rounded-xl border bg-background p-1 shadow-xl animate-in slide-in-from-top-2 duration-150"
                >
                  {/* User info header */}
                  <div className="px-3 py-2.5 border-b mb-1">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>

                  <DropdownMenu.Item asChild>
                    <Link
                      href="/platform/profile"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted cursor-pointer focus:outline-none focus:bg-muted"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      Profile & Settings
                    </Link>
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="my-1 h-px bg-muted" />

                  <DropdownMenu.Item asChild>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer focus:outline-none focus:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        {/* Bottom nav (mobile only) */}
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur md:hidden">
          <div className="flex items-center justify-around">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
