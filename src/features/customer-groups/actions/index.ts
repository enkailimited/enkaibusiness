"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createGroup,
  updateGroup,
  getGroup,
  listGroups,
  deleteGroup,
} from "../services/group-service";
import { createGroupSchema, updateGroupSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createGroupAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    discountPercent: formData.get("discountPercent") || 0,
    isDefault: formData.get("isDefault") === "true",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createGroup(parsed.data, businessId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/customer-groups`);
  }

  return result;
}

export async function updateGroupAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateGroupSchema.safeParse({
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    discountPercent: formData.get("discountPercent") || undefined,
    isDefault: formData.get("isDefault") !== undefined ? formData.get("isDefault") === "true" : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateGroup(id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/customer-groups`);
  }

  return result;
}

export async function getGroupAction(id: string) {
  await requireAuth();
  return getGroup(id);
}

export async function listGroupsAction(businessId: string) {
  await requireAuth();
  return listGroups(businessId);
}

export async function deleteGroupAction(id: string, businessId: string) {
  await requireAuth();
  const result = await deleteGroup(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/customer-groups`);
  }
  return result;
}
