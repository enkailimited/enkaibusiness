"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { AuthProvider } from "@/features/auth/components/auth-provider";
import { FirdausProvider, FirdausGlobalListener, FirdausToast } from "@/features/enkai";

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
            <FirdausToast />
          </FirdausProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
