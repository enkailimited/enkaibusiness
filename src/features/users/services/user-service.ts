import "server-only";

import { prisma } from "@/server/db";
import { searchService } from "@/server/search";
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
  nida: string | null;
  address: string;
  isActive: boolean;
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
  userRoles?: { role: { id: string; name: string; slug: string; scope: string } }[];
  invites?: { status: string; createdAt: Date }[];
  guarantor?: {
    id: string;
    fullName: string;
    phone: string;
    relationship: string;
    address: string;
  } | null;
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
    nida: user.nida,
    address: user.address,
    isActive: user.isActive,
    isOnboarded: user.isOnboarded,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: user.userRoles?.map((ur) => ur.role),
    inviteStatus: latestInvite?.status ?? null,
    inviteSentAt: latestInvite?.createdAt ?? null,
    guarantor: user.guarantor ?? null,
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
      guarantor: true,
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
  if (input.nida !== undefined) data.nida = input.nida || null;
  if (input.address !== undefined) data.address = input.address;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data,
    });

    if (input.guarantor) {
      await tx.guarantor.upsert({
        where: { userId },
        create: {
          userId,
          fullName: input.guarantor.fullName,
          phone: input.guarantor.phone,
          relationship: input.guarantor.relationship,
          address: input.guarantor.address,
        },
        update: {
          fullName: input.guarantor.fullName,
          phone: input.guarantor.phone,
          relationship: input.guarantor.relationship,
          address: input.guarantor.address,
        },
      });
    }
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { guarantor: true },
  });

  return toProfile(user!);
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

  const result = await searchService.users<any>({
    query: params?.search,
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
      guarantor: true,
    },
    orderBy: { createdAt: "desc" },
    offset: (page - 1) * limit,
    limit,
  });

  return { users: result.items.map(toProfile), total: result.total };
}

export async function activateUser(userId: string): Promise<UserProfile> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
    include: { guarantor: true },
  });
  return toProfile(user);
}

export async function deactivateUser(userId: string): Promise<UserProfile> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    include: { guarantor: true },
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
