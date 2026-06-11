import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import type { AuthUser, SessionUser } from "@/types/auth";

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) return null;

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isOnboarded: true,
      },
    });

    return dbUser;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return null;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isOnboarded: true,
        userRoles: {
          select: {
            role: {
              select: {
                slug: true,
                rolePermissions: {
                  select: {
                    permission: { select: { slug: true } },
                  },
                },
              },
            },
            businessId: true,
          },
        },
      },
    });

    if (!dbUser) return null;

    const roles = dbUser.userRoles.map((ur) => ur.role.slug);
    const permissions = dbUser.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.slug),
    );

    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      avatarUrl: dbUser.avatarUrl,
      isOnboarded: dbUser.isOnboarded,
      roles: [...new Set(roles)],
      permissions: [...new Set(permissions)],
      currentWorkspaceId: null,
      currentBusinessId: null,
    };
  } catch (error) {
    console.error("getSessionUser error:", error);
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
