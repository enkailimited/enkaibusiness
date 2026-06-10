import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateWorkspaceSchema, AddMemberSchema } from "@/lib/validations/workspace";

export async function createWorkspace(
  data: CreateWorkspaceSchema,
  userId: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const workspace = await prisma.workspace.create({
      data: {
        ...data,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
    });

    return {
      success: true,
      message: "Workspace created successfully",
      data: { id: workspace.id },
    };
  } catch (error) {
    console.error("Create workspace error:", error);
    return { success: false, message: "Failed to create workspace" };
  }
}

export async function getWorkspace(id: string) {
  return prisma.workspace.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: { select: { businesses: true } },
    },
  });
}

export async function getUserWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      _count: { select: { members: true, businesses: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addWorkspaceMember(
  workspaceId: string,
  data: AddMemberSchema,
): Promise<ActionResponse> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return { success: false, message: "User not found with this email" };
    }

    const existing = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: user.id, workspaceId },
      },
    });

    if (existing) {
      return { success: false, message: "User is already a member of this workspace" };
    }

    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role: data.role,
      },
    });

    return { success: true, message: "Member added successfully" };
  } catch (error) {
    console.error("Add member error:", error);
    return { success: false, message: "Failed to add member" };
  }
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<ActionResponse> {
  try {
    await prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });
    return { success: true, message: "Member removed successfully" };
  } catch (error) {
    console.error("Remove member error:", error);
    return { success: false, message: "Failed to remove member" };
  }
}
