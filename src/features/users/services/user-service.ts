import "server-only";

import { prisma } from "@/server/db";
import { USER_PAGE_SIZE } from "@/features/users/constants";
import type { UserProfile, UpdateProfileInput } from "@/features/users/types";

function toProfile(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  username: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
  userRoles?: { role: { id: string; name: string; slug: string; scope: string } }[];
  invites?: { status: string; createdAt: Date }[];
}): UserProfile {
  const latestInvite = user.invites?.length ? user.invites[0] : null;
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    username: user.username,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    isOnboarded: user.isOnboarded,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: user.userRoles?.map((ur) => ur.role),
    inviteStatus: latestInvite?.status ?? null,
    inviteSentAt: latestInvite?.createdAt ?? null,
  };
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        select: {
          role: { select: { id: true, name: true, slug: true, scope: true } },
        },
      },
    },
  });
  return user ? toProfile(user) : null;
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UserProfile> {
  const data: Record<string, string | null | undefined> = {};

  if (input.firstName !== undefined) data.firstName = input.firstName;
  if (input.lastName !== undefined) data.lastName = input.lastName;
  if (input.phone !== undefined) data.phone = input.phone || null;
  if (input.username !== undefined) data.username = input.username || null;
  if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl || null;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return toProfile(user);
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  return getProfile(userId);
}

export async function listUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ users: UserProfile[]; total: number }> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? USER_PAGE_SIZE;
  const search = params?.search;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        userRoles: {
          select: {
            role: { select: { id: true, name: true, slug: true, scope: true } },
          },
        },
        invites: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, createdAt: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users: users.map(toProfile), total };
}

export async function activateUser(userId: string): Promise<UserProfile> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
  });
  return toProfile(user);
}

export async function deactivateUser(userId: string): Promise<UserProfile> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });
  return toProfile(user);
}

export async function deleteUser(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });
}
