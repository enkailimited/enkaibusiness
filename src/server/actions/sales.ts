"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  getHierarchyLevels as getSalesHierarchy,
  createHierarchyLevel as createSalesHierarchy,
  deleteHierarchyLevel as deleteSalesHierarchy,
} from "@/features/sales-network/services/hierarchy-service";
import {
  listProfiles as getSalesProfiles,
  createProfile as createSalesProfile,
  updateProfile as updateSalesProfile,
  getTeamTree,
} from "@/features/sales-network/services/profile-service";
import {
  createSalesHierarchySchema,
  createSalesProfileSchema,
  updateSalesProfileSchema,
} from "@/lib/validations/sales";
import type { ActionResponse } from "@/types/relationships";

export async function getSalesHierarchyAction() {
  await requireAuth();
  return getSalesHierarchy();
}

export async function createSalesHierarchyAction(
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

  const result = await createSalesHierarchy(parsed.data);

  if (result.success) {
    revalidatePath("/sales/hierarchy");
  }

  return result;
}

export async function deleteSalesHierarchyAction(id: string) {
  await requireAuth();
  const result = await deleteSalesHierarchy(id);

  if (result.success) {
    revalidatePath("/sales/hierarchy");
  }

  return result;
}

export async function getSalesProfilesAction() {
  await requireAuth();
  return getSalesProfiles();
}

export async function createSalesProfileAction(
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

  const result = await createSalesProfile(userId, parsed.data);

  if (result.success) {
    revalidatePath("/sales/profiles");
  }

  return result;
}

export async function updateSalesProfileAction(
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

  const result = await updateSalesProfile(userId, parsed.data);

  if (result.success) {
    revalidatePath("/sales/profiles");
  }

  return result;
}

export async function getTeamTreeAction(managerId: string) {
  await requireAuth();
  return getTeamTree(managerId);
}
