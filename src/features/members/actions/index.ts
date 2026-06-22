"use server";

import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { serialize } from "@/lib/utils";
import type { ActionResponse } from "@/types/relationships";
import {
  generateTempPassword,
  setUserPassword,
  sendInviteEmail,
  createUserInvite,
} from "@/features/users/services/invite-service";

export async function getMembersAction() {
  const user = await requireAuth();

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true, workspace: { select: { name: true } } },
  });
  if (!membership) return { members: [], workspaceName: "" };

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: membership.workspaceId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
          invites: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { status: true, createdAt: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const result = members.map((m) => ({
    ...m,
    user: {
      ...m.user,
      inviteStatus: m.user.invites[0]?.status ?? null,
      inviteSentAt: m.user.invites[0]?.createdAt ?? null,
    },
  }));

  return serialize({ members: result, workspaceName: membership.workspace.name });
}

export async function reinviteWorkspaceMemberAction(
  memberId: string,
  data?: { email?: string; phone?: string }
): Promise<ActionResponse> {
  try {
    const sessionUser = await requireAuth();

    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true } },
        workspace: { select: { name: true } },
      },
    });

    if (!member) {
      return { success: false, message: "Workspace member not found" };
    }

    if (!member.user.isActive) {
      return { success: false, message: "Cannot re-invite inactive user" };
    }

    const targetEmail = data?.email || member.user.email;
    const targetPhone = data?.phone !== undefined ? data.phone : member.user.phone;

    if (data?.email || data?.phone !== undefined) {
      await prisma.user.update({
        where: { id: member.user.id },
        data: {
          ...(data.email ? { email: data.email } : {}),
          ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        },
      });
    }

    const tempPassword = generateTempPassword();
    await setUserPassword(member.user.id, tempPassword);
    await createUserInvite(member.user.id, targetEmail, targetPhone || null, sessionUser.id);

    const invitedByName = `${sessionUser.firstName} ${sessionUser.lastName}`.trim() || "Admin";
    const emailSent = await sendInviteEmail(targetEmail, tempPassword, invitedByName, member.workspace.name, true);

    return {
      success: true,
      message: emailSent
        ? "Re-invitation sent successfully."
        : "Re-invitation created but email could not be sent.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to re-invite member",
    };
  }
}
