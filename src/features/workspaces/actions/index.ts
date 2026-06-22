"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
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
  await requireAuth();

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
  await requireAuth();
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
  await requireAuth();

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
  await requireAuth();

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
  await requireAuth();
  const result = await removeWorkspaceMember(workspaceId, userId);
  if (result.success) {
    revalidatePath(`/workspaces/${workspaceId}`);
  }
  return result;
}

export async function createMyWorkspaceAction() {
  const user = await requireAuth();

  const wsName = `${user.firstName} ${user.lastName}'s Workspace`;
  const slug = `${user.firstName.toLowerCase()}-${user.lastName.toLowerCase()}-${Date.now()}`;

  const result = await createWorkspace(
    { name: wsName, slug, description: "Personal workspace" },
    user.id,
  );

  if (result.success) {
    revalidatePath("/workspaces");
  }

  return result;
}
