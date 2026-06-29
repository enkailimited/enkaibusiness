import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateWorkspaceSchema, AddMemberSchema } from "../schemas";

export async function ensureRbacWorkspaceRole(userId: string, role: string, tx?: typeof prisma): Promise<void> {
  const client = tx || prisma;
  const roleSlug = `${role.toLowerCase()}-workspace`;
  const rbacRole = await client.role.findUnique({
    where: { slug: roleSlug },
    select: { id: true },
  });
  if (!rbacRole) return;
  const existing = await client.userRole.findFirst({
    where: { userId, roleId: rbacRole.id, businessId: null },
  });
  if (!existing) {
    await client.userRole.create({
      data: { userId, roleId: rbacRole.id, businessId: null },
    });
  }
}

async function removeRbacWorkspaceRole(userId: string, role: string): Promise<void> {
  const roleSlug = `${role.toLowerCase()}-workspace`;
  const rbacRole = await prisma.role.findUnique({
    where: { slug: roleSlug },
    select: { id: true },
  });
  if (!rbacRole) return;
  await prisma.userRole.deleteMany({
    where: { userId, roleId: rbacRole.id, businessId: null },
  });
}

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

    await ensureRbacWorkspaceRole(userId, "OWNER");

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

export async function updateWorkspace(
  id: string,
  data: Partial<CreateWorkspaceSchema>,
): Promise<ActionResponse> {
  try {
    await prisma.workspace.update({ where: { id }, data });
    return { success: true, message: "Workspace updated successfully" };
  } catch (error) {
    console.error("Update workspace error:", error);
    return { success: false, message: "Failed to update workspace" };
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

export async function deleteWorkspace(id: string): Promise<ActionResponse> {
  try {
    await prisma.workspace.delete({ where: { id } });
    return { success: true, message: "Workspace deleted successfully" };
  } catch (error) {
    console.error("Delete workspace error:", error);
    return { success: false, message: "Failed to delete workspace" };
  }
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

    await ensureRbacWorkspaceRole(user.id, data.role);

    return { success: true, message: "Member added successfully" };
  } catch (error) {
    console.error("Add member error:", error);
    return { success: false, message: "Failed to add member" };
  }
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  role: string,
): Promise<ActionResponse> {
  try {
    const existing = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!existing) {
      return { success: false, message: "Member not found" };
    }

    await prisma.workspaceMember.update({
      where: { userId_workspaceId: { userId, workspaceId } },
      data: { role: role as any },
    });

    await removeRbacWorkspaceRole(userId, existing.role);
    await ensureRbacWorkspaceRole(userId, role);

    return { success: true, message: "Member role updated successfully" };
  } catch (error) {
    console.error("Update member role error:", error);
    return { success: false, message: "Failed to update member role" };
  }
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<ActionResponse> {
  try {
    const existing = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    await prisma.workspaceMember.delete({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (existing) {
      await removeRbacWorkspaceRole(userId, existing.role);
    }

    return { success: true, message: "Member removed successfully" };
  } catch (error) {
    console.error("Remove member error:", error);
    return { success: false, message: "Failed to remove member" };
  }
}

export async function getWorkspaceMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
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
    orderBy: { joinedAt: "desc" },
  });
}
