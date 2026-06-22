"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { AuthProvider, useAuth } from "@/features/auth/components/auth-provider";
import { FirdausProvider, FirdausGlobalListener, FirdausToast, FirdausResponseToast } from "@/features/enkai";
import { LauncherSound } from "@/components/launcher-sound";

function FirdausGreeter() {
  const { user } = useAuth();
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
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <FirdausProvider>
            {children}
            <FirdausGlobalListener />
            <FirdausGreeter />
            <FirdausResponseToast />
            <LauncherSound />
          </FirdausProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
