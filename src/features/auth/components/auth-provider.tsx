"use client";

import { createContext, useContext, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/auth-store";
import { getCurrentUserPermissionsAction } from "@/features/users/actions";
import type { SessionUser } from "@/features/auth/types";

interface AuthContextValue {
  user: SessionUser | null;
  isPending: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isPending: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const { user, setUser, clearUser, isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    async function hydrate() {
      if (!session?.user) {
        clearUser();
        return;
      }

      try {
        setLoading(true);
        const [meRes, permRes] = await Promise.all([
          fetch("/api/auth/me").then((r) => r.ok ? r.json() : null),
          getCurrentUserPermissionsAction(),
        ]);

        const roles = permRes?.success ? (permRes as { roles: string[] }).roles ?? [] : [];
        const permissions = permRes?.success ? (permRes as { permissions: string[] }).permissions ?? [] : [];

        if (meRes?.user) {
          setUser({
            id: meRes.user.id,
            email: meRes.user.email,
            firstName: meRes.user.firstName,
            lastName: meRes.user.lastName,
            avatarUrl: meRes.user.avatarUrl ?? null,
            isOnboarded: meRes.user.isOnboarded,
            roles,
            permissions,
            currentWorkspaceId: null,
            currentBusinessId: null,
          });
          return;
        }

        // Fallback to session payload
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          firstName: (session.user as Record<string, unknown>).firstName as string || "",
          lastName: (session.user as Record<string, unknown>).lastName as string || "",
          avatarUrl:
            ((session.user as Record<string, unknown>).avatarUrl as string | null) ??
            (session.user as Record<string, unknown>).image?.toString() ??
            null,
          isOnboarded: (session.user as Record<string, unknown>).isOnboarded as boolean || false,
          roles,
          permissions,
          currentWorkspaceId: null,
          currentBusinessId: null,
        });
      } finally {
        setLoading(false);
      }
    }

    if (!isPending) {
      hydrate();
    }
  }, [session, isPending, setUser, clearUser, setLoading]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isPending: isPending || isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
