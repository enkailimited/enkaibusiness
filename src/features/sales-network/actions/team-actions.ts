"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { serialize } from "@/lib/utils";

const ROLE_TO_HIERARCHY: Record<string, string> = {
  "national-sales-manager": "national-sales-manager",
  "national-manager": "national-sales-manager",
  "regional-manager": "region-manager",
  "team-leader": "team-leader",
  freelancer: "freelancer",
};

const HIERARCHY_LEVEL: Record<string, number> = {
  "national-sales-manager": 1,
  "region-manager": 2,
  "team-leader": 3,
  freelancer: 4,
};

const CAN_ADD: Record<number, number[]> = {
  1: [2, 3, 4],
  2: [3, 4],
  3: [4],
  4: [],
};

const SALES_ROLES = Object.keys(ROLE_TO_HIERARCHY);

async function seedHierarchies() {
  const count = await prisma.salesHierarchy.count();
  if (count > 0) return;
  const levels: { slug: string; title: string; level: number; description: string }[] = [
    { slug: "national-sales-manager", title: "National Sales Manager", level: 1, description: "Oversees all national sales operations" },
    { slug: "region-manager", title: "Region Manager", level: 2, description: "Manages sales in a specific region" },
    { slug: "team-leader", title: "Team Leader", level: 3, description: "Leads a team of freelance sales agents" },
    { slug: "freelancer", title: "Freelancer", level: 4, description: "Independent sales agent" },
  ];
  for (const l of levels) {
    await prisma.salesHierarchy.upsert({
      where: { slug: l.slug },
      update: {},
      create: l,
    });
  }
}

async function ensureSalesProfile(userId: string) {
  const existing = await prisma.salesProfile.findUnique({
    where: { userId },
    include: { hierarchy: true },
  });
  if (existing) return existing;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: { role: true },
      },
    },
  });
  if (!user) return null;

  const salesRole = user.userRoles.find((ur) => SALES_ROLES.includes(ur.role.slug));
  if (!salesRole) return null;

  const hierarchySlug = ROLE_TO_HIERARCHY[salesRole.role.slug];
  if (!hierarchySlug) return null;

  const hierarchy = await prisma.salesHierarchy.findUnique({
    where: { slug: hierarchySlug },
  });
  if (!hierarchy) return null;

  const created = await prisma.salesProfile.create({
    data: {
      userId,
      hierarchyId: hierarchy.id,
      status: "ACTIVE",
    },
    include: { hierarchy: true },
  });

  return created;
}

async function buildTeamTree(managerProfileId: string) {
  const subs = await prisma.salesProfile.findMany({
    where: { managerId: managerProfileId },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
      hierarchy: true,
      _count: { select: { subordinates: true, leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const children = [];
  for (const sub of subs) {
    const [grandchildren, latestInvite] = await Promise.all([
      buildTeamTree(sub.id),
      prisma.userInvite.findFirst({
        where: { userId: sub.userId },
        orderBy: { createdAt: "desc" },
        select: { status: true, createdAt: true },
      }),
    ]);
    children.push({
      ...sub,
      inviteStatus: latestInvite?.status || null,
      inviteSentAt: latestInvite?.createdAt?.toISOString() || null,
      subordinates: grandchildren,
    });
  }

  return children;
}

export async function getMyTeamAction() {
  const user = await requireAuth();

  let profile = await prisma.salesProfile.findUnique({
    where: { userId: user.id },
    include: {
      hierarchy: true,
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
    },
  });

  if (!profile) {
    profile = await ensureSalesProfile(user.id);
  }

  if (!profile) return null;

  const tree = await buildTeamTree(profile.id);

  return serialize({ profile, tree });
}

export async function getMyHierarchyLevelAction() {
  const user = await requireAuth();

  const profile = await prisma.salesProfile.findUnique({
    where: { userId: user.id },
    include: { hierarchy: true },
  });

  if (profile?.hierarchy) {
    const level = HIERARCHY_LEVEL[profile.hierarchy.slug];
    return { level: level ?? null, hierarchy: profile.hierarchy };
  }

  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id, businessId: null },
    include: { role: true },
  });

  const salesRole = userRoles.find((ur) => SALES_ROLES.includes(ur.role.slug));
  if (!salesRole) return { level: null, hierarchy: null };

  return { level: null, hierarchy: null };
}

export async function getAddableHierarchiesAction() {
  const user = await requireAuth();

  let profile = await prisma.salesProfile.findUnique({
    where: { userId: user.id },
    include: { hierarchy: true },
  });

  if (!profile) {
    profile = await ensureSalesProfile(user.id);
  }

  if (!profile || !profile.hierarchy) return [];

  const myLevel = HIERARCHY_LEVEL[profile.hierarchy.slug];
  if (!myLevel) return [];

  const addableLevels = CAN_ADD[myLevel] || [];
  if (addableLevels.length === 0) return [];

  const slugs = Object.entries(HIERARCHY_LEVEL)
    .filter(([, level]) => addableLevels.includes(level))
    .map(([slug]) => slug);

  let hierarchies = await prisma.salesHierarchy.findMany({
    where: { slug: { in: slugs } },
    orderBy: { level: "asc" },
  });

  if (hierarchies.length === 0) {
    await seedHierarchies();
    hierarchies = await prisma.salesHierarchy.findMany({
      where: { slug: { in: slugs } },
      orderBy: { level: "asc" },
    });
  }

  return hierarchies;
}

export async function searchUsersAction(search: string) {
  const user = await requireAuth();

  if (!search || search.length < 2) return [];

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
    take: 10,
  });

  return users;
}

export async function addTeamMemberAction(
  _prevState: { success: boolean; message: string } | null,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const authUser = await requireAuth();
    const targetUserId = formData.get("userId") as string;
    const hierarchyId = formData.get("hierarchyId") as string;

    if (!targetUserId || !hierarchyId) {
      return { success: false, message: "User and hierarchy level are required" };
    }

    let managerProfile = await prisma.salesProfile.findUnique({
      where: { userId: authUser.id },
      include: { hierarchy: true },
    });

    if (!managerProfile) {
      managerProfile = await ensureSalesProfile(authUser.id);
    }

    if (!managerProfile) {
      return { success: false, message: "You don't have a sales profile" };
    }

    const managerLevel = HIERARCHY_LEVEL[managerProfile.hierarchy?.slug ?? ""];
    if (!managerLevel || managerLevel === 4) {
      return { success: false, message: "You are not authorized to add team members" };
    }

    const targetHierarchy = await prisma.salesHierarchy.findUnique({
      where: { id: hierarchyId },
    });

    if (!targetHierarchy) {
      return { success: false, message: "Invalid hierarchy level" };
    }

    const targetLevel = HIERARCHY_LEVEL[targetHierarchy.slug];
    const addableLevels = CAN_ADD[managerLevel] || [];

    if (!targetLevel || !addableLevels.includes(targetLevel)) {
      return { success: false, message: "You cannot add this hierarchy level" };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return { success: false, message: "User not found" };
    }

    const existingProfile = await prisma.salesProfile.findUnique({
      where: { userId: targetUserId },
    });

    if (existingProfile) {
      return { success: false, message: "User already has a sales profile" };
    }

    await prisma.salesProfile.create({
      data: {
        userId: targetUserId,
        hierarchyId,
        managerId: managerProfile.id,
        status: "ACTIVE",
      },
    });

    revalidatePath("/platform/sales-team/team");
    return { success: true, message: "Team member added successfully" };
  } catch (error) {
    console.error("Add team member error:", error);
    return { success: false, message: "Failed to add team member" };
  }
}
