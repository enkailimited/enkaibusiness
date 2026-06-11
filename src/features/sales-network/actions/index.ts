"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createHierarchyLevel,
  updateHierarchyLevel,
  deleteHierarchyLevel,
  getHierarchyLevels,
  getHierarchyLevel,
} from "../services/hierarchy-service";
import {
  createProfile,
  updateProfile,
  getProfile,
  listProfiles,
  getTeamTree,
  getFreelancers,
} from "../services/profile-service";
import { createSalesHierarchySchema, updateSalesHierarchySchema, createSalesProfileSchema, updateSalesProfileSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";
import type { ProfileFilter } from "../types";

export async function getHierarchyLevelsAction() {
  await requireAuth();
  return getHierarchyLevels();
}

export async function getHierarchyLevelAction(id: string) {
  await requireAuth();
  return getHierarchyLevel(id);
}

export async function createHierarchyLevelAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createSalesHierarchySchema.safeParse({
    level: formData.get("level") ? Number(formData.get("level")) : undefined,
    title: formData.get("title"),
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

  const result = await createHierarchyLevel(parsed.data);

  if (result.success) {
    revalidatePath("/sales/hierarchy");
  }

  return result;
}

export async function updateHierarchyLevelAction(
  id: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateSalesHierarchySchema.safeParse({
    level: formData.get("level") ? Number(formData.get("level")) : undefined,
    title: formData.get("title") || undefined,
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

  const result = await updateHierarchyLevel(id, parsed.data);

  if (result.success) {
    revalidatePath("/sales/hierarchy");
  }

  return result;
}

export async function deleteHierarchyLevelAction(id: string) {
  await requireAuth();
  const result = await deleteHierarchyLevel(id);

  if (result.success) {
    revalidatePath("/sales/hierarchy");
  }

  return result;
}

export async function listProfilesAction(filter?: ProfileFilter) {
  await requireAuth();
  return listProfiles(filter);
}

export async function getProfileAction(userId: string) {
  await requireAuth();
  return getProfile(userId);
}

export async function createProfileAction(
  userId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createSalesProfileSchema.safeParse({
    phone: formData.get("phone") || undefined,
    photo: formData.get("photo") || undefined,
    region: formData.get("region") || undefined,
    hierarchyId: formData.get("hierarchyId") || undefined,
    managerId: formData.get("managerId") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createProfile(userId, parsed.data);

  if (result.success) {
    revalidatePath("/sales/profiles");
  }

  return result;
}

export async function updateProfileAction(
  userId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateSalesProfileSchema.safeParse({
    phone: formData.get("phone") || undefined,
    photo: formData.get("photo") || undefined,
    region: formData.get("region") || undefined,
    hierarchyId: formData.get("hierarchyId") || undefined,
    managerId: formData.get("managerId") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateProfile(userId, parsed.data);

  if (result.success) {
    revalidatePath("/sales/profiles");
  }

  return result;
}

export async function getTeamTreeAction(managerId: string) {
  await requireAuth();
  return getTeamTree(managerId);
}

export async function getFreelancersAction() {
  await requireAuth();
  return getFreelancers();
}
