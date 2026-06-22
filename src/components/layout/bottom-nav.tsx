"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MoreHorizontal, LogOut, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface NavItem {
  title: string;
  href: string;
  icon: any;
}

interface BottomNavProps {
  items: NavItem[];
  maxVisible?: number;
}

export function BottomNav({ items, maxVisible = 4 }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  const visibleItems = items.slice(0, maxVisible);
  const overflowItems = items.slice(maxVisible);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-around">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/") && item.href.split("/").filter(Boolean).length > 2);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-bold uppercase tracking-tight transition-all min-w-0 flex-1",
                  isActive
                    ? "text-primary border-t-2 border-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setSheetOpen(true)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-bold uppercase tracking-tight transition-all min-w-0 flex-1",
              sheetOpen
                ? "text-primary border-t-2 border-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Bottom sheet overlay */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 md:hidden"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[70] rounded-t-2xl border-t bg-background p-4 shadow-xl transition-transform duration-300 md:hidden",
          sheetOpen ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold">More</span>
          <button onClick={() => setSheetOpen(false)} className="rounded-full p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto space-y-0.5">
          {overflowItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/") && item.href.split("/").filter(Boolean).length > 2);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSheetOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}

          <hr className="my-2" />

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
