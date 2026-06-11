import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import type { SessionUser } from "@/types/auth";

function mapDbUserToSessionUser(dbUser: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isOnboarded: boolean;
  userRoles: Array<{
    role: {
      slug: string;
      scope: string;
      rolePermissions: Array<{ permission: { slug: string } }>;
    };
    businessId: string | null;
  }>;
  workspaceMemberships?: Array<{
    workspaceId: string;
  }>;
}): SessionUser {
  const roles = [...new Set(dbUser.userRoles.map((ur) => ur.role.slug))];
  const permissions = [
    ...new Set(dbUser.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.slug))),
  ];
  const currentWorkspaceId = dbUser.workspaceMemberships?.[0]?.workspaceId || null;
  const currentBusinessId = dbUser.userRoles.find((ur) => ur.businessId)?.businessId || null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    avatarUrl: dbUser.avatarUrl,
    isOnboarded: dbUser.isOnboarded,
    roles,
    permissions,
    currentWorkspaceId,
    currentBusinessId,
  };
}

export async function getCurrentSession(): Promise<{
  user: SessionUser | null;
  session: unknown | null;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { user: null, session: null };
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
                scope: true,
                rolePermissions: {
                  select: { permission: { select: { slug: true } } },
                },
              },
            },
            businessId: true,
          },
        },
        workspaceMemberships: {
          select: { workspaceId: true },
          take: 1,
        },
      },
    });

    if (!dbUser) {
      return { user: null, session: null };
    }

    return { user: mapDbUserToSessionUser(dbUser), session };
  } catch {
    return { user: null, session: null };
  }
}

export async function validateSession(): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return !!session?.user;
  } catch {
    return false;
  }
}

export async function refreshSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch {
    return null;
  }
}
