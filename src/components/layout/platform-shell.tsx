"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell";

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSalesTeam = pathname.startsWith("/platform/sales-team");

  if (isSalesTeam) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
