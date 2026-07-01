"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/features/auth/components/auth-provider";
import { FirdausProvider, FirdausGlobalListener, FirdausToast, FirdausResponseToast } from "@/features/enkai";
import { LauncherSound } from "@/components/launcher-sound";
import { Toaster } from "@/components/ui/toaster";

const PUBLIC_ROUTES = new Set([
  "/login", "/register", "/forgot-password", "/reset-password",
  "/landing", "/marketing",
]);

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (pathname.startsWith("/public/")) return true;
  return false;
}

function FirdausGreeter() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (isPublicRoute(pathname)) return null;
  if (!user?.id) return null;

  const name = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || undefined : undefined;
  return <FirdausToast userName={name} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <AuthProvider>
          <FirdausProvider>
            {children}
            <FirdausGlobalListener />
            <FirdausGreeter />
            <FirdausResponseToast />
            <Toaster />
            <LauncherSound />
          </FirdausProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
