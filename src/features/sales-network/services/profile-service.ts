import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateSalesProfileSchema, UpdateSalesProfileSchema } from "../schemas";
import type { ProfileWithCounts, ProfileWithTree, ProfileWithUser, FreelancerProfile, ProfileFilter } from "../types";

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  isActive: true,
} as const;

const subUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const managerInclude = {
  include: {
    user: { select: { id: true, firstName: true, lastName: true } },
  },
} as const;

export async function createProfile(
  userId: string,
  data: CreateSalesProfileSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const existing = await prisma.salesProfile.findUnique({ where: { userId } });
    if (existing) {
      return { success: false, message: "User already has a sales profile" };
    }

    const profile = await prisma.salesProfile.create({
      data: {
        userId,
        phone: data.phone || null,
        photo: data.photo || null,
        region: data.region || null,
        hierarchyId: data.hierarchyId || null,
        managerId: data.managerId || null,
      },
    });

    return {
      success: true,
      message: "Sales profile created successfully",
      data: { id: profile.id },
    };
  } catch (error) {
    console.error("Create profile error:", error);
    return { success: false, message: "Failed to create sales profile" };
  }
}

export async function updateProfile(
  userId: string,
  data: UpdateSalesProfileSchema,
): Promise<ActionResponse> {
  try {
    await prisma.salesProfile.update({
      where: { userId },
      data: {
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.photo !== undefined && { photo: data.photo || null }),
        ...(data.region !== undefined && { region: data.region || null }),
        ...(data.hierarchyId !== undefined && { hierarchyId: data.hierarchyId || null }),
        ...(data.managerId !== undefined && { managerId: data.managerId || null }),
      },
    });
    return { success: true, message: "Sales profile updated successfully" };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, message: "Failed to update sales profile" };
  }
}

export async function getProfile(userId: string): Promise<ProfileWithTree | null> {
  const profile = await prisma.salesProfile.findUnique({
    where: { userId },
    include: {
      user: { select: userSelect },
      hierarchy: true,
      manager: managerInclude,
      subordinates: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          hierarchy: true,
        },
      },
      _count: { select: { leads: true, subordinates: true } },
    },
  });

  return profile as unknown as ProfileWithTree | null;
}

export async function getProfileById(id: string): Promise<ProfileWithUser | null> {
  const profile = await prisma.salesProfile.findUnique({
    where: { id },
    include: {
      user: { select: userSelect },
      hierarchy: true,
      manager: managerInclude,
    },
  });

  return profile as unknown as ProfileWithUser | null;
}

export async function listProfiles(filter?: ProfileFilter): Promise<ProfileWithCounts[]> {
  const where: Record<string, unknown> = {};

  if (filter?.status) where.status = filter.status;
  if (filter?.hierarchyId) where.hierarchyId = filter.hierarchyId;
  if (filter?.managerId) where.managerId = filter.managerId;
  if (filter?.search) {
    where.OR = [
      { user: { firstName: { contains: filter.search, mode: "insensitive" } } },
      { user: { lastName: { contains: filter.search, mode: "insensitive" } } },
      { user: { email: { contains: filter.search, mode: "insensitive" } } },
    ];
  }

  const profiles = await prisma.salesProfile.findMany({
    where,
    include: {
      user: { select: userSelect },
      hierarchy: true,
      manager: managerInclude,
      _count: { select: { subordinates: true, leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return profiles as unknown as ProfileWithCounts[];
}

async function buildSubTree(profileId: string): Promise<ProfileWithTree[]> {
  const subs = await prisma.salesProfile.findMany({
    where: { managerId: profileId },
    include: {
      user: { select: { ...userSelect } },
      hierarchy: true,
      _count: { select: { subordinates: true, leads: true } },
    },
  });

  const result: ProfileWithTree[] = [];
  for (const sub of subs) {
    const children = await buildSubTree(sub.id);
    result.push({ ...(sub as unknown as ProfileWithTree), children });
  }
  return result;
}

export async function getTeamTree(managerId: string): Promise<ProfileWithTree | null> {
  const manager = await prisma.salesProfile.findUnique({
    where: { id: managerId },
    include: {
      user: { select: userSelect },
      hierarchy: true,
      _count: { select: { subordinates: true, leads: true } },
    },
  });

  if (!manager) return null;

  const children = await buildSubTree(manager.id);
  return { ...(manager as unknown as ProfileWithTree), children };
}

export async function getSubordinates(managerId: string): Promise<ProfileWithCounts[]> {
  const manager = await prisma.salesProfile.findUnique({
    where: { id: managerId },
    select: { id: true },
  });

  if (!manager) return [];

  const profiles = await prisma.salesProfile.findMany({
    where: { managerId },
    include: {
      user: { select: userSelect },
      hierarchy: true,
      _count: { select: { subordinates: true, leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return profiles as unknown as ProfileWithCounts[];
}

export async function getFreelancers(): Promise<FreelancerProfile[]> {
  const profiles = await prisma.salesProfile.findMany({
    where: {
      hierarchy: { slug: "freelancer" },
      status: "ACTIVE",
    },
    include: {
      user: { select: { ...userSelect } },
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return profiles as unknown as FreelancerProfile[];
}
