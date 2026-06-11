"use server";

import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { serialize } from "@/lib/utils";

export async function getMembersAction() {
  const user = await requireAuth();

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
  });
  if (!membership) return [];

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: membership.workspaceId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, isActive: true } },
    },
    orderBy: { joinedAt: "asc" },
  });
  return serialize(members);
}
