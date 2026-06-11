"use client";

import { useAuth } from "@/features/auth/components/auth-provider";

export function usePermission(permissionSlug: string): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return user.permissions.includes(permissionSlug);
}

export function useHasAnyPermission(slugs: string[]): boolean {
  const { user } = useAuth();
  if (!user || !user.permissions.length) return false;
  return slugs.some((s) => user.permissions.includes(s));
}

export function useHasAllPermissions(slugs: string[]): boolean {
  const { user } = useAuth();
  if (!user || !user.permissions.length) return false;
  return slugs.every((s) => user.permissions.includes(s));
}
