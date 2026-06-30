"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createBranch,
  updateBranch,
  getBranch,
  getBusinessBranches,
  deleteBranch,
} from "../services/branch-service";
import { createBranchSchema, updateBranchSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createBranchAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createBranchSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    country: formData.get("country") || "Tanzania",
    postalCode: formData.get("postalCode") || undefined,
    isHeadOffice: formData.get("isHeadOffice") === "true",
    openingTime: formData.get("openingTime") || undefined,
    closingTime: formData.get("closingTime") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createBranch(businessId, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/branches`);
  }

  return result;
}

export async function updateBranchAction(
  branchId: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateBranchSchema.safeParse({
    name: formData.get("name") || undefined,
    code: formData.get("code") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    country: formData.get("country") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    isHeadOffice: formData.get("isHeadOffice") === "true" || undefined,
    openingTime: formData.get("openingTime") || undefined,
    closingTime: formData.get("closingTime") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateBranch(branchId, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/branches`);
  }

  return result;
}

export async function getBranchAction(id: string) {
  await requireAuth();
  return getBranch(id);
}

export async function getBusinessBranchesAction(businessId: string) {
  await requireAuth();
  return getBusinessBranches(businessId);
}

export async function deleteBranchAction(businessId: string, branchId: string) {
  await requireAuth();
  const result = await deleteBranch(branchId);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/branches`);
  }
  return result;
}
