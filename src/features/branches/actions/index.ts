"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import {
  createBranch,
  updateBranch,
  getBranch,
  getBusinessBranches,
  deleteBranch,
} from "../services/branch-service";
import { createBranchSchema, updateBranchSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";
import { getBranchingMode } from "@/features/branches/services/branch-scope-service";
import {
  getConsolidatedBranchReport,
  getBranchPayables,
  getBranchReceivables,
  getBranchInventorySummary,
} from "@/features/branches/services/branch-reports-service";

export async function createBranchAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const can = await hasPermission(user.id, "branches.create", businessId);
  if (!can) return { success: false, message: "You do not have permission" };

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
  const user = await requireAuth();
  const can = await hasPermission(user.id, "branches.update", businessId);
  if (!can) return { success: false, message: "You do not have permission" };

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
  const user = await requireAuth();
  const can = await hasPermission(user.id, "branches.delete", businessId);
  if (!can) return { success: false, message: "You do not have permission" };
  const result = await deleteBranch(branchId);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/branches`);
  }
  return result;
}

export async function getBranchingModeAction(businessId: string) {
  return getBranchingMode(businessId);
}

export async function getConsolidatedBranchReportAction(
  businessId: string,
  dateFrom?: string,
  dateTo?: string,
) {
  return getConsolidatedBranchReport(
    businessId,
    dateFrom ? new Date(dateFrom) : undefined,
    dateTo ? new Date(dateTo) : undefined,
  );
}

export async function getBranchPayablesAction(
  businessId: string,
  branchId: string | null,
  allBranches?: boolean,
) {
  return getBranchPayables(businessId, branchId, allBranches);
}

export async function getBranchReceivablesAction(
  businessId: string,
  branchId: string | null,
  allBranches?: boolean,
) {
  return getBranchReceivables(businessId, branchId, allBranches);
}

export async function getBranchInventorySummaryAction(
  businessId: string,
  branchId: string | null,
  allBranches?: boolean,
) {
  return getBranchInventorySummary(businessId, branchId, allBranches);
}
