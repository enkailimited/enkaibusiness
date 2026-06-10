"use server";

import { requireAuth } from "@/server/auth";
import { createWorkspace, getWorkspace, getUserWorkspaces, addWorkspaceMember, removeWorkspaceMember } from "@/server/services/workspace-service";
import { createWorkspaceSchema, addMemberSchema } from "@/lib/validations/workspace";
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

  return createWorkspace(parsed.data, user.id);
}

export async function getUserWorkspacesAction() {
  const user = await requireAuth();
  return getUserWorkspaces(user.id);
}

export async function getWorkspaceAction(id: string) {
  await requireAuth();
  return getWorkspace(id);
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

  return addWorkspaceMember(workspaceId, parsed.data);
}

export async function removeMemberAction(workspaceId: string, userId: string) {
  await requireAuth();
  return removeWorkspaceMember(workspaceId, userId);
}
