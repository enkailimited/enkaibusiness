"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import {
  createWorkspace,
  updateWorkspace,
  getWorkspace,
  getUserWorkspaces,
  deleteWorkspace,
  addWorkspaceMember,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
} from "../services/workspace-service";
import { createWorkspaceSchema, updateWorkspaceSchema, addMemberSchema, updateMemberRoleSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createWorkspaceAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "workspaces.create");
  if (!can) return { success: false, message: "You do not have permission to create workspaces" };

  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createWorkspace(parsed.data, user.id);

  if (result.success) {
    revalidatePath("/workspaces");
  }

  return result;
}

export async function updateWorkspaceAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "workspaces.update");
  if (!can) return { success: false, message: "You do not have permission to update workspaces" };

  const parsed = updateWorkspaceSchema.safeParse({
    name: formData.get("name") || undefined,
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateWorkspace(id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/${id}`);
  }

  return result;
}

export async function getUserWorkspacesAction() {
  const user = await requireAuth();
  return getUserWorkspaces(user.id);
}

export async function getWorkspaceAction(id: string) {
  await requireAuth();
  return getWorkspace(id);
}

export async function deleteWorkspaceAction(id: string) {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "workspaces.delete");
  if (!can) return { success: false, message: "You do not have permission to delete workspaces" };
  const result = await deleteWorkspace(id);
  if (result.success) {
    revalidatePath("/workspaces");
  }
  return result;
}

export async function addMemberAction(
  workspaceId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "workspaces.manage_members");
  if (!can) return { success: false, message: "You do not have permission to manage members" };

  const parsed = addMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await addWorkspaceMember(workspaceId, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/${workspaceId}`);
  }

  return result;
}

export async function updateMemberRoleAction(
  workspaceId: string,
  userId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "workspaces.manage_members");
  if (!can) return { success: false, message: "You do not have permission to manage members" };

  const parsed = updateMemberRoleSchema.safeParse({
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateWorkspaceMemberRole(workspaceId, userId, parsed.data.role);

  if (result.success) {
    revalidatePath(`/workspaces/${workspaceId}`);
  }

  return result;
}

export async function removeMemberAction(workspaceId: string, userId: string) {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "workspaces.manage_members");
  if (!can) return { success: false, message: "You do not have permission to manage members" };
  const result = await removeWorkspaceMember(workspaceId, userId);
  if (result.success) {
    revalidatePath(`/workspaces/${workspaceId}`);
  }
  return result;
}

export async function createMyWorkspaceAction() {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "workspaces.create");
  if (!can) return { success: false, message: "You do not have permission to create workspaces" };

  const wsName = `${user.firstName} ${user.lastName}'s Workspace`;
  const slug = `${user.firstName.toLowerCase()}-${user.lastName.toLowerCase()}-${Date.now()}`;

  const result = await createWorkspace(
    { name: wsName, slug, description: "Personal workspace" },
    user.id,
  );

  if (result.success) {
    // Assign business-level owner role so user can access workspace
    // User will create their actual business later after login
    const ownerRole = await prisma.role.findUnique({ where: { slug: "owner" } });
    if (ownerRole) {
      const existing = await prisma.userRole.findFirst({
        where: { userId: user.id, roleId: ownerRole.id, businessId: null },
      });
      if (!existing) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: ownerRole.id, businessId: null },
        });
      }
    }

    revalidatePath("/workspaces");
  }

  return result;
}
