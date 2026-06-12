import "server-only";

import { prisma } from "@/server/db";

export interface PermissionCheck {
  allowed: boolean;
  role?: string;
  level?: string;
}

export async function checkPermission(
  userId: string,
  businessId: string,
  requiredPermission: string,
): Promise<PermissionCheck> {
  if (!requiredPermission) return { allowed: true };

  try {
    const staff = await prisma.staff.findFirst({
      where: { userId, businessId },
      include: {
        assignments: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });

    if (!staff) return { allowed: false };

    for (const assignment of staff.assignments) {
      if (!assignment.role) continue;
      const perms = assignment.role.permissions.map((rp) => rp.permission.key);
      if (perms.includes(requiredPermission) || perms.includes("*")) {
        return { allowed: true, role: assignment.role.name };
      }
    }

    return { allowed: false, role: staff.assignments[0]?.role?.name };
  } catch {
    return { allowed: false };
  }
}

export async function checkSalesHierarchy(
  userId: string,
): Promise<{ level: string | null; regionId?: string }> {
  try {
    const profile = await prisma.salesProfile.findFirst({
      where: { userId },
      include: {
        nationalManager: true,
        regionalManager: true,
        teamLeader: true,
        freelancer: true,
      },
    });

    if (!profile) return { level: null };

    if (profile.nationalManager) return { level: "national_manager" };
    if (profile.regionalManager) return { level: "regional_manager", regionId: profile.regionalManager.regionId || undefined };
    if (profile.teamLeader) return { level: "team_leader" };
    if (profile.freelancer) return { level: "freelancer" };

    return { level: null };
  } catch {
    return { level: null };
  }
}
