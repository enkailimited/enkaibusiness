"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createAssignmentSchema, updateAssignmentSchema } from "../schemas";
import {
  createAssignment,
  updateAssignment,
  getAssignment,
  getAssignmentsForItem,
  removeAssignment,
} from "../services/assignment-service";
import type { ActionResponse } from "@/types/relationships";

export async function createAssignmentAction(
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createAssignmentSchema.safeParse({
    businessId: formData.get("businessId"),
    catalogItemId: formData.get("catalogItemId"),
    branchId: formData.get("branchId") || undefined,
    storeId: formData.get("storeId") || undefined,
    isAvailable: formData.get("isAvailable") === "true",
    sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createAssignment(parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${parsed.data.businessId}/commerce/catalog`);
  }

  return result;
}

export async function updateAssignmentAction(
  assignmentId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateAssignmentSchema.safeParse({
    isAvailable: formData.get("isAvailable") !== undefined
      ? formData.get("isAvailable") === "true"
      : undefined,
    sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  return updateAssignment(assignmentId, parsed.data);
}

export async function getAssignmentsForItemAction(catalogItemId: string) {
  await requireAuth();
  return getAssignmentsForItem(catalogItemId);
}

export async function removeAssignmentAction(
  assignmentId: string,
  businessId: string,
): Promise<ActionResponse> {
  await requireAuth();

  const result = await removeAssignment(assignmentId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/catalog`);
  }

  return result;
}
